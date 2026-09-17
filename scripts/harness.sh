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
#
# With no fixture-dir, a fresh one is built. Run from the repo root.

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

echo "prompt:     $PROMPT"
echo "fixture:    $FIXTURE"
echo "transcript: $TRANSCRIPT"
echo

( cd "$FIXTURE" && timeout "${HARNESS_TIMEOUT:-1800}" claude -p "$PROMPT" \
    --plugin-dir "$PLUGIN" \
    --add-dir "$PLUGIN" \
    --strict-mcp-config \
    --permission-mode bypassPermissions \
    --output-format stream-json --verbose \
    --no-session-persistence ) > "$TRANSCRIPT" 2>"$TRANSCRIPT.err"

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

result = ""
for line in raw.splitlines():
    try:
        ev = json.loads(line)
    except Exception:
        continue
    if ev.get("type") == "result":
        result = ev.get("result", "") or ""

print("references whose CONTENT arrived:", ", ".join(read) if read else "none")
print("permission refusals:             ", refusals)
print("report length:                   ", len(result), "chars")
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
