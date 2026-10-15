#!/usr/bin/env bash
#
# Run a morgan command headless against a fixture and score the transcript.
#
# Why this exists as a committed script. The mechanics of the 0.1.16 and 0.1.17 measurements
# were never written down — only their conclusions — so the next cycle had to re-derive the
# invocation from scratch, and re-derive it wrong once. A measurement you cannot re-run is an
# anecdote. This file is the measurement.
#
# The invocation below is not a guess. It was established by a two-armed probe: the same
# prompt, the same working directory, with and without --add-dir. Without it, every read of a
# plugin reference came back "Claude requested permissions to read from …" — the refusal
# recorded in CLAUDE.md 0.1.17. With it, the file content arrived. The plugin lives outside the
# session's working directory, and --add-dir is what reaches it.
#
#   --plugin-dir           load the plugin from this working tree, not the installed cache.
#                          The cache on a dev machine can be many versions behind; without
#                          this you measure old text and never find out.
#   --add-dir <plugin>     grant reads of the references. Narrow on purpose: granting the whole
#                          repo also exposes morgan's own .camp/, and a run then reads another
#                          job's working logs and folds them into its report. The fixture must
#                          be the only .camp/ a run can see.
#   --strict-mcp-config    no MCP servers at all. That is criterion H7, and it has to be
#                          enforced by the harness rather than left to whatever the machine
#                          happens to have connected.
#   --output-format        stream-json is what makes a run scoreable: every tool call and its
#                          result is an event, so "was the reference read" is a fact about the
#                          transcript rather than an impression.
#
# HARNESS_MCP=plugin relaxes H7 by exactly one notch: the plugin's own MCP servers load, and
# nothing else does. Measured before it was written (0.2.0 spike S-B): --strict-mcp-config
# suppresses servers a plugin declares in its manifest, so a run that needs the vault server
# cannot carry the flag. Two things replace it. Every installed plugin is disabled through
# --settings, because the installed cache on a dev machine is an older morgan with the same
# name, and two copies of one plugin is a measurement of nothing. And --max-budget-usd caps
# the run, because a server that answers is a server the agent can loop on. The default mode
# is byte-for-byte what it was; the scorer additionally reports the run's cost and every
# mcp__ tool the agent called, in both modes.
#
# SCORING — read this before changing it.
#
# A run is INVALID if a reference read was refused, and an invalid run's numbers mean nothing:
# the command was scored without the method it runs on. 0.1.17 took a full cycle of quality
# scores on runs where no reference ever arrived, and the scores looked fine.
#
# Reads are detected by CONTENT, not by tool name. The agent may read a file with the Read
# tool, or with `cat`, or `sed -n`, and which one it picks varies between runs — the first
# real run here used `cat` for both references. A scorer keyed on '"name":"Read"' reports
# "never read" for a run that read everything, which is the same class of error the whole
# exercise exists to avoid. So: take a distinctive line out of each reference and look for it
# anywhere in the transcript. If the text arrived, it arrived.
#
# Usage:
#   scripts/harness.sh "/morgan:board FIX-101 FIX-102" [fixture-dir] [out-dir]
#   HARNESS_MCP=plugin MORGAN_VAULT_REPO=... MORGAN_VAULT_DATA=... scripts/harness.sh "..." fixture-dir
#
# With no fixture-dir, a fresh one is built. Run from the repo root.
# HARNESS_BUDGET (USD, plugin mode only, default 6) and HARNESS_TIMEOUT (seconds) are honoured.

set -u

PROMPT="${1:-}"
if [ -z "$PROMPT" ]; then
  echo "usage: scripts/harness.sh \"<slash command and args>\" [fixture-dir] [out-dir]" >&2
  exit 2
fi

REPO="$(pwd)"
PLUGIN="$REPO/plugin"
REFS="$PLUGIN/skills/morgan/references"

if [ ! -d "$REFS" ]; then
  echo "harness: run me from the repo root (no $REFS)" >&2
  exit 2
fi

FIXTURE="${2:-}"
OUTDIR="${3:-$REPO/.camp/runs}"
mkdir -p "$OUTDIR"

if [ -z "$FIXTURE" ]; then
  FIXTURE="$(mktemp -d)/morgan-fixture"
  "$REPO/scripts/fixture/make-fixture.sh" "$FIXTURE" >/dev/null || exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
SLUG="$(printf '%s' "$PROMPT" | tr -cs 'A-Za-z0-9' '-' | sed 's/^-//;s/-$//' | cut -c1-40)"
TRANSCRIPT="$OUTDIR/$STAMP-$SLUG.jsonl"

MODE="${HARNESS_MCP:-none}"
case "$MODE" in
  none)
    MCP_ARGS=(--strict-mcp-config)
    ;;
  plugin)
    # Disable every installed plugin so the only plugin in the session is --plugin-dir.
    DISABLED="$(python3 - <<'PY'
import json, pathlib
reg = pathlib.Path.home() / ".claude" / "plugins" / "installed_plugins.json"
names = []
try:
    names = sorted(json.loads(reg.read_text()).get("plugins", {}).keys())
except Exception:
    pass
if "morgan@morgan" not in names:
    names.append("morgan@morgan")
print(json.dumps({"enabledPlugins": {n: False for n in names}}))
PY
)"
    MCP_ARGS=(--settings "$DISABLED" --max-budget-usd "${HARNESS_BUDGET:-6}")
    ;;
  *)
    echo "harness: HARNESS_MCP must be 'none' (default) or 'plugin', got '$MODE'" >&2
    exit 2
    ;;
esac

echo "prompt:     $PROMPT"
echo "fixture:    $FIXTURE"
echo "transcript: $TRANSCRIPT"
echo "mcp:        $MODE"
if [ "$MODE" = plugin ]; then
  echo "vault repo: ${MORGAN_VAULT_REPO:-<unset>}"
  echo "vault data: ${MORGAN_VAULT_DATA:-<unset>}"
fi
echo

( cd "$FIXTURE" && timeout "${HARNESS_TIMEOUT:-1800}" claude -p "$PROMPT" \
    --plugin-dir "$PLUGIN" \
    --add-dir "$PLUGIN" \
    "${MCP_ARGS[@]}" \
    --permission-mode bypassPermissions \
    --output-format stream-json --verbose \
    --no-session-persistence </dev/null ) > "$TRANSCRIPT" 2>"$TRANSCRIPT.err"

RC=$?
echo "exit:       $RC"
echo

python3 - "$TRANSCRIPT" "$REFS" <<'PY'
import json, pathlib, sys

transcript = pathlib.Path(sys.argv[1])
refs_dir = pathlib.Path(sys.argv[2])
raw = transcript.read_text(errors="replace")

# A line long enough to be unique to its file, taken from the body rather than the title.
def marker(path):
    best = ""
    for line in path.read_text().splitlines():
        line = line.strip()
        if line.startswith("#") or line.startswith("|") or len(line) < 40:
            continue
        if len(line) > len(best):
            best = line
        if len(best) > 90:
            break
    return best

read, unread = [], []
for ref in sorted(refs_dir.glob("*.md")):
    m = marker(ref)
    if m and m in raw:
        read.append(ref.stem)
    else:
        unread.append(ref.stem)

refusals = raw.count("requested permissions to read from")

# Which MCP tools the agent called, and how often. Counted from tool_use events, not from
# prose, so "the agent used the vault" is a fact about the transcript.
result = ""
cost = None
mcp_calls = {}
for line in raw.splitlines():
    try:
        ev = json.loads(line)
    except Exception:
        continue
    if ev.get("type") == "result":
        result = ev.get("result", "") or ""
        cost = ev.get("total_cost_usd")
    if ev.get("type") == "assistant":
        for block in (ev.get("message") or {}).get("content") or []:
            name = block.get("name") if isinstance(block, dict) and block.get("type") == "tool_use" else None
            if name and name.startswith("mcp__"):
                mcp_calls[name] = mcp_calls.get(name, 0) + 1

print("references whose CONTENT arrived:", ", ".join(read) if read else "none")
print("permission refusals:             ", refusals)
print("report length:                   ", len(result), "chars")
print("cost (USD):                      ", f"{cost:.4f}" if isinstance(cost, (int, float)) else "unknown")
print("mcp tools called:                ", ", ".join(f"{k}×{v}" for k, v in sorted(mcp_calls.items())) if mcp_calls else "none")
print()
if refusals:
    print("VERDICT: INVALID RUN — a read was refused, so the command ran without its method.")
    print("         Do not score this run. Check --add-dir points at the plugin directory.")
    sys.exit(1)
if not result:
    print("VERDICT: INVALID RUN — no final report. The run did not finish.")
    sys.exit(1)
print("VERDICT: valid run — score it.")
PY

SCORE_RC=$?
echo
echo "fixture left at: $FIXTURE"
exit $SCORE_RC
