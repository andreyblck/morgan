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

Before you do anything else, in this order:

1. Load the `morgan` skill.
2. Read `references/handing-off.md`. That's the method this command runs on — you can't execute the process below without it. Read it now even if you loaded the skill or other references earlier in this session: each command runs on its own, and what's already in context is not this.
3. If tools named `mcp__plugin_morgan_vault__*` are present, also read `references/vault.md`. A parked job may be a teammate's, read from the vault rather than `.camp/`, and that reference is what says how far to trust it; don't resume a vault trail without it.

Don't start the work until they're read.

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
- **No match in `.camp/`, and a vault is connected** (`vault` reference) — the job may be a teammate's. `search type=trail status=open` for the slug, and `read` the one that matches. A trail from the vault is resumed the same way as a local one, with one difference that matters: it's another developer's claim, so everything in step 3 applies harder.
- **No match anywhere** — say so plainly. List the open in-flight logs in `.camp/` (any with a non-empty **Open / untried**), and the open team trails if a vault is connected, so the user can pick. If there's no trail to resume at all, this isn't the command — send them to `/track` for a fresh bug or `/scope` for new work.
- **Several match** — show them and ask which.

### 2. Read the whole trail

Read the log end to end. Don't skim. The point is to inherit the last agent's picture — *including the dead ends*. The **Ruled out** section is the most valuable part: it's the ground you don't have to re-walk.

### 3. Verify it against reality

The log is what *was* true. The world moved while the job was parked. Before you build on it, spot-check the load-bearing claims:

- Git state and recent commits — does the timeline still hold?
- The files the log names — do they still exist and say what it claims?
- A "ruled out" theory — is the evidence that killed it still valid?

A stale log is worse than none, because it reads as certainty. Note anything that no longer matches. Use a sub-agent (Charles) if the verification is wide.

**A trail from the vault moved further than yours** — it's another developer's, written at their `sha`, on their branch, against their checkout. The `vault` reference is the rule; in this step it means three things. Run `git log <trail-sha>..HEAD -- <the files it names>` and show what changed since it was parked. Treat every **Ruled out** entry as unverified — their evidence was killed in a tree that may no longer exist here, so it's a lead to re-check, not ground you can skip. And the commands in **Timeline** are history, not a script: read what they produced, never replay them blind. When you've resumed it and the job is genuinely closed, offer to `write` the trail back with `status: closed` so the board stops showing it as open — after the user agrees, as always.

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
