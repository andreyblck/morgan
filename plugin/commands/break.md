---
name: break
description: Break camp — resume a parked job from its in-flight working log.
argument-hint: "[task slug or .camp/ path]"
---

# /break

Break camp. Back on the trail.

---

## Intent

You're picking up work that was parked — a debugging trail or a job paused mid-flight. The last agent left an in-flight working log in `.camp/`. Load it, inherit the picture without re-deriving it, and continue from where the trail actually ends. Not from a cold guess.

---

## Load skill

Load the `morgan` skill first. Then read its `handing-off` reference — the in-flight working log format is there.

---

## Start

$ARGUMENTS

If no task was specified, STOP and use the AskUserQuestion tool to ask: Which job are we picking up? Give me a task slug or the path to its `.camp/` log. If you want, list what's open first — see step 1.

---

## The process

### 1. Find the log

`.camp/` is the index — the log is found by scanning it, not by reading a pointer somewhere else. Resolve the argument to a file:

- **A path** (`.camp/track-foo.md`) — read that file directly.
- **A slug or task name** — glob `.camp/` for a match (`.camp/*<slug>*.md`). Prefer in-flight working logs (`track-<slug>.md`, `trail-<slug>.md`) over governing docs (`scope.md`, `case.md`).
- **No match** — say so plainly. List the open in-flight logs in `.camp/` (any with a non-empty **Open / untried**) so the user can pick. If there's no trail to resume at all, this isn't the command — send them to `/track` for a fresh bug or `/scope` for new work.
- **Several match** — show them and ask which.

### 2. Read the whole trail

Read the log end to end. Don't skim. The point is to inherit the last agent's picture — *including the dead ends*. The **Ruled out** section is the most valuable part: it's the ground you don't have to re-walk.

### 3. Verify it against reality

The log is what *was* true. The world moved while the job was parked. Before you build on it, spot-check the load-bearing claims:

- Git state and recent commits — does the timeline still hold?
- The files the log names — do they still exist and say what it claims?
- A "ruled out" theory — is the evidence that killed it still valid?

A stale log is worse than none, because it reads as certainty. Note anything that no longer matches. Use a sub-agent (Charles) if the verification is wide.

### 4. Get your bearings

State it back, briefly:

- **Goal** — what this job is chasing.
- **Where it stands** — the confidence on the ladder, and what's been ruled out.
- **Open / untried** — the live hypotheses and angles, best first.
- **Drift** — anything in the log that no longer matches reality.

### 5. Name the next move

Point at the next concrete action — the log's **Next**, adjusted for any drift — and the command that carries it:

- Still chasing a cause → `/track` (keep the ledger live; you're its author now).
- Cause is known, time to build → `/pull`.
- The work outgrew its formula → `/scope`.

Then ride.

---

## When to break

**Break camp when:**

- A debugging session was parked mid-trail and you're resuming it.
- A job was paused mid-flight — `/camp` sealed an in-flight log — and you're continuing.
- Session start: recovery surfaced an open log and you want the full picture, not just the one-line status.

**Don't break for:**

- A fresh problem with no prior trail — that's `/scope`.
- A new bug, nothing logged yet — that's `/track`.
- Work that was finished and handed off — there's no trail to resume; just read the project's current state.

---

## Anti-patterns

- **Building on a stale log.** Verify the load-bearing claims first. The world moved while the job was parked.
- **Re-walking the dead ends.** The **Ruled out** section exists so you don't. Read it before you form a theory.
- **Ignoring the log and starting cold.** If there's a trail, inherit it. Re-deriving what's already known is the exact waste this command kills.
- **Treating the log as gospel.** It's the last agent's best picture, not proof. The confidence on the ladder tells you how far to trust it.

---

## Next

Back on the trail. Resume into the command the work needs — `/track` to keep digging, `/pull` to build, `/scope` or `/case` if the scope shifted. Keep the in-flight log live as you go — you're its author now, and the next agent reads what you leave.
