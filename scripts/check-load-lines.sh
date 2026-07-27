#!/usr/bin/env bash
#
# Pre-push check: keep command load lines tied to demonstrated use.
#
# Every command opens with "## Load skill" naming the references it reads. Each named
# reference is a whole-file read paid on every invocation of that command, so a load
# line that grows costs real context on work that never touches the reference.
#
# Three hard failures:
#   1. A command has no "## Load skill" section.
#   2. A load line names a reference file that doesn't exist (the 0.1.13 failure mode,
#      which resolved command pointers but never resolved reference pointers).
#   3. The count of UNCITED pairs rises above the baseline below.
#
# "Uncited" means: the command loads the reference, but nowhere outside the Load
# section does the body cite it as a reference — no `name` in backticks, no
# references/name.md path. That is a weaker claim than "unused". A command can act
# on a reference without naming it: /track loads `tracing` and its whole procedure
# IS the tracing method. So this is a ratchet, not a verdict — it stops load lines
# from growing without stopping work. Drive the baseline down when a trim lands;
# never raise it. If you believe a new pair is justified, the reviewer needs to see
# that belief written down, which is what raising it would hide.
#
# Run from the repo root.

set -u

BASELINE=11

fail=0
uncited=0

for f in plugin/commands/*.md; do
  cmd=$(basename "$f" .md)

  if ! grep -q '^## Load skill' "$f"; then
    echo "MISSING   /$cmd has no '## Load skill' section"
    fail=1
    continue
  fi

  load=$(awk '/^## Load skill/{f=1;next} /^## /{f=0} f' "$f")
  body=$(awk '/^## Load skill/{f=1;next} /^## /{f=0} !f' "$f")

  refs=$(printf '%s' "$load" \
    | grep -oE 'references/[a-z-]+\.md|`[a-z-]+`' \
    | sed 's|references/||; s|\.md$||; s|`||g' \
    | grep -vx 'morgan' | sort -u)

  for r in $refs; do
    if [ ! -f "plugin/skills/morgan/references/$r.md" ]; then
      echo "DANGLING  /$cmd loads '$r' — plugin/skills/morgan/references/$r.md does not exist"
      fail=1
      continue
    fi
    if ! printf '%s' "$body" | grep -qE "\`$r\`|references/$r\.md"; then
      echo "UNCITED   /$cmd loads '$r' but never cites it outside the Load section"
      uncited=$((uncited + 1))
    fi
  done
done

echo
echo "uncited pairs: $uncited (baseline $BASELINE)"

if [ "$uncited" -gt "$BASELINE" ]; then
  echo "FAIL: a load line grew. Either the command body cites the new reference where it"
  echo "      governs a decision, or the reference doesn't belong in the load line."
  fail=1
elif [ "$uncited" -lt "$BASELINE" ]; then
  echo "Baseline is stale — lower BASELINE in this script to $uncited and commit that with the trim."
  fail=1
fi

exit $fail
