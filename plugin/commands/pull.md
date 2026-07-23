---
name: pull
description: Build to spec — TDD where it makes sense, commits at logical boundaries, match the codebase's patterns.
argument-hint: "[work item or prep path]"
---

# /pull

Pull the job clean.

---

## Intent

You're building. Not vibing. Not hacking. Building to spec against a sealed formula and an approved prep. Read patterns. Work in small increments. Test as you go. Commit at logical boundaries. Don't drift.

---

## Load skill

Load the `morgan` skill first. Then read `references/building.md`, `references/breakdown.md`, and `references/verification.md`. If the work involves UI or visual design, also read `references/frontend-design.md`.

---

## Start

$ARGUMENTS

If no task was specified, STOP and ask: "What are we pulling? Point me to the work item or prep doc. If there's no scope, `/scope` first."

---

## Pre-flight

### 1. Verify readiness

- [ ] Formula and prep are sealed and at hand.
- [ ] Acceptance criteria for this work item are specific.
- [ ] Dependencies on prior items are satisfied.
- [ ] You've read the surrounding code — patterns, naming, structure.
- [ ] Pre-commit hooks exist (lint, type check, format, tests). If missing and the work is real, set them up first — then prove they bite before trusting them.
- [ ] Governing docs at hand — `.camp/` artefacts, project `CLAUDE.md`, project-specific references.

If any are unclear, stop. Don't `/pull` without a formula and prep.

### 2. Research with sub-agents

Don't waste main context on pattern hunting:
- **Existing patterns** → Charles. "Find similar implementations. Specify directories and behavior."
- **Test approaches** → Charles. "How is this kind of code tested here? Frameworks, layout, conventions."
- **Conflicts and dependencies** → Lenny or Charles. "What modules will this change touch? What contracts depend on the current behavior?"

**Brief each sub-agent with:**

- Specific files or directories to focus on — not "the codebase".
- What to look for: patterns, naming conventions, structural rules — not "find patterns".
- The acceptance criteria for context on what's being built.
- Expected output: file paths, code excerpts, and a summary of how existing code handles this kind of work.

Validate findings against the actual code before trusting them.

### 3. Build a checklist

Convert acceptance criteria into a checklist:
- Setup (branch, deps, env).
- Implementation (each criterion as a checkbox).
- Tests (new, existing coverage).
- Documentation.

---

## The discipline

### Work incrementally

Build in small steps. After each:
1. Make the change.
2. Run the relevant local check (test, type check, lint).
3. If it fails, fix it before the next change.
4. Move on.

No big-bang. No "implement everything, then test."

### TDD where it fits

For business logic, algorithms, APIs, service methods:
1. Write the test. Run it. Watch it fail, and check it failed for the reason you expect.
2. Write the best implementation — not just enough to pass.
3. Refactor if needed.
4. Repeat until the unit is complete.
5. Run the local checks (lint, type check, build, tests). Self-review. Then commit.

Test what's worth testing. Don't theatre-test glue code or declarative UI just to hit coverage numbers. What makes a test evidence rather than noise is in the `building` reference — four conditions, and a test that misses one still goes green.

### Match existing patterns

- Match naming.
- Match structure.
- Match layering.
- Match error handling.

You're contributing, not signing your initials. Introducing a new pattern is sometimes correct — only with a clear reason and the user's agreement.

### Stay within scope

- Implement the acceptance criteria. Nothing more.
- Pragmatic cleanup of code you're touching is craft, not creep.
- "While I'm here…" is separate work. File it as a follow-up.

### Commit at logical boundaries

A commit = a self-contained unit that could be reverted whole. Sometimes that's a full work item; sometimes it's a meaningful part of one.

- One commit per work item, when items are right-sized.
- Smaller commits when an item naturally splits.
- Larger commits when items only make sense together.
- If the user's workflow is "finish all work, review, then commit" — match that. Don't commit between items.

Commit messages: 1–2 lines, imperative, explain *why* not *what*. No AI co-author byline. No `--no-verify` unless explicitly asked.

---

## Self-review before declaring done

Run automated checks first. Then review what tooling can't catch.

**Would you approve this PR?**

- [ ] Automated checks pass (lint, type check, format, build, tests).
- [ ] No commented-out code.
- [ ] No debug statements (`console.log`, `print`).
- [ ] Variable names mean something.
- [ ] DRY without premature abstraction.
- [ ] Error paths handled.
- [ ] Edge cases handled (null, empty, boundary, overflow).
- [ ] No hardcoded paths, secrets, or env-specific values.
- [ ] No test computes its expected value the way the implementation does.

Use sub-agents for review when scope warrants it. Charles or Lenny for code review. Sadie for security. Tilly for UI.

---

## Definition of done

- [ ] All acceptance criteria met.
- [ ] Tests written and passing.
- [ ] Automated checks green.
- [ ] Code matches existing patterns.
- [ ] Self-review complete.
- [ ] Documentation updated (if behavior changed).

Can't tick all? Not done.

---

## Persist

`/pull` doesn't produce a persistence artefact by itself — it produces code. Commits go to git. Notes during the build can land in `.camp/` if needed (e.g., a discovery that informs a later pivot).

When the work item is done, mark it done in the prep.

---

## Anti-patterns

- Big-bang implementation.
- "I'll add tests later." (You won't.)
- Giant commits with vague messages.
- Scope creep via "while I'm here."
- Refactoring unrelated code during implementation.
- Coverage gaming.
- Skipping pre-commit hooks.
- Self-declaring done without review.
- Pulling without a formula or prep — that's hacking, not building.

---

## Next

Item done? Mark it done in the prep. Feature done? `/clean` to verify against the formula. Otherwise — back here for the next item. Don't move on with red checks.
