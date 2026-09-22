# Haul ledger — {{run-id}}

<!--
The run's state machine, not a diary. Written as things happen, never reconstructed at the end.
If the run dies, this file is how the next agent knows what's merged, what's proven, and what's
still out there.
-->

**Invocation:** `/haul {{flags}} {{filter}}`
**Started:** {{timestamp}} · **Marker:** `{{run marker}}`
**Brief:** `.camp/haul-{{date}}-brief.md`

## Now

| In flight | Merged, not proven | Done | Limit: workers / merged-not-proven | Mode |
|---|---|---|---|---|
| 0 | 0 | 0 | {{N}} / {{2 × N}} | intake |

Mode is `intake`, `drain — backlog`, `drain — red lane`, or `stopped — <reason>`.

## Ground truth

- **Tracker:** {{tool and access path}} · statuses: ready = {{…}}, started = {{…}}, review = {{…}}, terminal = {{…}}
- **Integration branch / pre-production target:** {{…}}
- **Production branch / target:** {{… or "branch reach only"}}
- **Promote convention:** {{…}}
- **Checks:** {{commands}} · **Hooks:** {{local | CI, per recipe statement …}}
- **Recipe:** {{where it was read}} · **Refused flags:** {{none, or which and why}}
- **Existed before the run:** {{branches and worktrees present at start — cleanup never touches these}}

## Queue

| Issue | Class | Admission | State | Worker | PR @ revision | Tracker | Notes |
|---|---|---|---|---|---|---|---|
| {{key}} | build / verify-only / investigation | admitted | Admitted | — | — | ready | |

## Excluded at admission

| Issue | Condition that failed | What a human needs to do |
|---|---|---|

## Lane health

| Time | Integration tip | Latest run | Verdict | First red merge | Action |
|---|---|---|---|---|---|

## Judgement calls

Every foreign check set aside, every promote parked, every deviation from the brief. One line
each, with the reason. Security checks never appear here as set aside.

| Time | Issue | Call | Reason |
|---|---|---|---|

## Evidence

One block per issue, appended as it moves.

### {{key}}

- **Worker report:** {{status}} — {{summary}}
- **Merged:** {{revision}} at {{time}}
- **Pre-production:** deployed revision {{…}} · probe {{output}} · control {{output}}
- **Promoted:** {{revision}} · dry run clean at {{time}}
- **Production:** deployed revision {{…}} · probe {{output}} · control {{output}}
- **Tracker:** evidence comment {{link}} → {{status}}
- **Created by this run:** {{branches, worktrees}}
- **Cleanup:** worktree ☐ · remote branch ☐ · CI labels ☐ · probe fixtures restored and checked ☐

## Decisions that are yours

| Issue | Question | Options |
|---|---|---|

## Replies awaiting your go

Drafted for the people who reported issues. Nothing here has been sent.

| Issue | To | Draft |
|---|---|---|

## Found while working

Problems seen along the way that no ticket covers. Proposed, not created.

## Cost

Workers spawned · tokens · CI minutes · wall time.
