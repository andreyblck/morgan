---
name: camp
description: Seal the session for the next agent. Update CLAUDE.md, persist artefacts.
argument-hint: "[notes]"
---

# /camp

Back to camp.

---

## Intent

The session is ending — or a milestone just landed — and the next agent starts fresh. They get no conversation history, no mental model, no context. Give them exactly what they need to continue. Nothing more, nothing less.

---

## Load skill

Load the `morgan` skill first. Then read its `handing-off` reference.

---

## Start

$ARGUMENTS

If no notes were specified, assess the session and proceed with the process below.

---

## The process

### 1. Scan for unpersisted work

Check the conversation for significant work products that exist only in context:

- Formulas (scope, success criteria, approach).
- Scout findings and recommendations.
- Decisions and rationale.
- Architecture or design work.
- Root cause analyses.
- **In-flight narrative** — on work still moving: what was tried, what it produced, what's ruled out, what's still open. Not a finished product, so it's the first thing to slip. If a `/track` ledger exists, it's already captured; otherwise seal it to `.camp/trail-<slug>.md` in the in-flight working log format (see `handing-off`).
- Anything that took substantial effort to produce.

**For each unpersisted item:** ask the user — "This exists only in conversation. Want me to save it?" Default to `.camp/` if they don't specify a location. Don't assume. Don't skip. Don't batch them — name each one specifically.

### 2. Assess current state

Answer these from what you know:
- What's in progress?
- What just completed?
- What's blocked or waiting?
- What's the logical next step?

If context is thin and you can't confidently answer these, use sub-agents to verify state:
- Check git status and recent commits for what actually changed.
- Verify key files exist and reflect what was discussed.

Be mindful of context. `/camp` is about sealing what you know, not starting new investigations. If you don't know the state of the project, that's a bigger problem than `/camp` can solve.

### 3. Update CLAUDE.md

Update the project root `CLAUDE.md` with current state:

- **Status** — what exists, what's in progress. Reflect reality, not plans.
- **Next** — specific next action. Not "continue working." What should the next agent do first?
- **Context** — 1–3 bullets of important context. Recent decisions, blockers, gotchas.
- **In flight** — if work is paused mid-stream, a one-line pointer to its in-flight working log (`.camp/track-<slug>.md` or `.camp/trail-<slug>.md`). The pointer goes here; the trail itself stays in `.camp/`.
- **Commands** — verify these still work. Update if anything changed.
- **Structure** — update if files or directories changed.

Keep it minimal. The next agent can explore — they need a launchpad, not a journal. The trail of a live investigation isn't journal-in-CLAUDE.md; it's a one-line pointer here to a log that lives in `.camp/`.

### 4. Close out

If there's completed work — items done, tests passing, self-review done — commit it along with the updated `CLAUDE.md`. Don't leave finished work uncommitted. Use sub-agents to verify if needed.

If work is genuinely in progress or the session is just reporting state, that's fine — not every `/camp` requires a commit. But "uncommitted changes" for completed work is a failure state. Either commit it, or be explicit about why it's not ready.

### 5. Verify

Before completing:

- [ ] All significant work products either saved or explicitly declined by user.
- [ ] Completed work committed (if applicable) — clean working tree.
- [ ] CLAUDE.md exists and is current.
- [ ] Status reflects actual state (not stale).
- [ ] Next action is specific and actionable.
- [ ] Commands section has working commands.
- [ ] Work still in motion has an in-flight log in `.camp/` (or nothing's in motion), and CLAUDE.md points to it.
- [ ] No claims of preserved work that only exists in conversation.

---

## When to camp

**Camp when:**
- The session is ending (user says goodbye, wrapping up).
- A major milestone completes (feature done, phase transition).
- Context is getting full and a fresh session is needed.
- Work is blocked and pausing.
- The user explicitly asks.

**Don't camp for:**
- Minor progress within a task.
- Quick questions or clarifications.
- No meaningful state change since last `/camp`.

---

## Anti-patterns

- **Too much detail.** This isn't full documentation. The next agent can explore. Focus on what's NOW and what's NEXT.
- **Vague next steps.** "Continue working" tells nothing. Be specific about the next action.
- **Stale information.** Wrong status is worse than no status. Verify before writing.
- **Skipping the work-product scan.** The whole point is nothing gets lost. Check the conversation.
- **Project history in CLAUDE.md.** Settled history belongs in commits and docs — but in-flight state (what you've tried and ruled out on work still moving) belongs in a `.camp/` working log, with CLAUDE.md carrying a one-line pointer. CLAUDE.md stays current state + next action; the trail lives in `.camp/`, not in commits it never reached.
- **Claiming work is preserved.** If it's only in conversation, say so. Don't let the user think it's saved when it isn't.
- **Leaving completed work uncommitted.** If the work is done, commit it. "There are uncommitted changes" for finished work is a failure state, not a status update.

---

## Next

Session sealed. New formula → `/scope`. New bug → `/track`. Need to learn before committing → `/scout`.
