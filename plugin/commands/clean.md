---
name: clean
description: Verify the work against the formula and prep before declaring done.
argument-hint: "[scope]"
---

# /clean

Walk away clean.

---

## Intent

You're verifying quality. Not "does it run" — does it actually work? Does it match the intent? Tests passing is not the same as done right.

---

## Load skill

Load the `morgan` skill first. Then read its `verification`, `building`, and `breakdown` references. If the work involves frontend, UI, or visual design, also read the `frontend-design` reference.

---

## Start

$ARGUMENTS

If no scope was specified, STOP and use the AskUserQuestion tool to ask: What should I verify? A specific file, feature, component, or recent changes?

---

## Verify with sub-agents

Spawn sub-agents to check in parallel. Don't waste context on verification tasks.

**Sub-agent tasks:**
- Review code against acceptance criteria (list every criterion explicitly in the prompt).
- Check for pattern violations and anti-patterns (name the patterns from the codebase and what violations look like).
- Verify test coverage and quality (specify the test directories and what should be tested). Give them the standard from the `building` reference, limited to what's visible in the code: on core logic, a test whose expected value is computed the way the implementation computes it, or one that asserts on the unit's private internals, or one that replaces a collaborator inside the codebase, is a Major finding. Tell them what isn't: a committed snapshot or golden file is not a finding unless it was updated alongside a behaviour change with no reason given, and database seeding, persisted-row assertions and injected failures are ordinary setup. Whether a test was seen failing isn't visible here — that one belongs to `/pull`.
- Run automated quality checks — lint, type check, build, test suite — and report pass/fail with any errors.
- Validate documentation accuracy (point to the docs and what they should reflect).

**Brief each sub-agent with:**
- The acceptance criteria verbatim. Sub-agents don't have the formula or spec.
- The quality standard: no commented-out code, no debug statements, consistent formatting, meaningful names, DRY, error handling complete, edge cases handled, no hardcoded credentials. Embed this checklist directly.
- The specific files and directories to review. Don't say "review the code." Say which code.
- Expected output: findings classified as Critical (must fix before shipping), Major (should fix), or Minor (nice to fix). Each finding with file path, line reference, and evidence.

**After collection:**
- Spot-check critical findings against the actual code. Sub-agents can misidentify anti-patterns or miss context that justifies a pattern.
- Synthesize into a verification report: what passes, what doesn't, what needs human judgment.

---

## Types of verification

### Before implementation

Verify readiness before building:

1. **Dependencies satisfied?** Are required pieces complete?
2. **Code examples correct?** Do they match the actual codebase?
3. **Patterns aligned?** Does the approach fit the architecture?
4. **Questions answered?** Any ambiguity that needs resolving?

Catching issues here is cheap. Catching them in production is expensive.

### After implementation

Verify the work meets criteria:

1. **Acceptance criteria** — each one explicitly verified.
   - Happy path works.
   - Error cases handled.
   - Edge cases covered.

2. **Code quality** — would you approve this PR?
   - Follows existing patterns.
   - No debug statements.
   - No commented code.
   - Error handling complete.

3. **Tests** — coverage that would catch a regression.
   - Tests exist for new functionality.
   - All tests passing.
   - Each one meets the standard in the `building` reference — a test that can't fail isn't coverage.

4. **Documentation** — updated and accurate.

### Alignment check

Does the artifact match its governing spec? Check `.camp/` for formulas, preps, or other in-flight docs that define the standard.

1. What are you validating?
2. Against what standard?
3. What's covered? What's missing?
4. Any contradictions?
5. Document ALL findings.

---

## Automated checks first

Run the automated gates before claiming anything is done — lint, type check, build, tests. Automated checks failing = definitely not done. These are the precondition, not the verification.

---

## Verification is human

Tests passing ≠ done right.

Someone must confirm the implementation satisfies the **intent**, not just that code exists that doesn't crash.

**Ask:**
- Does this solve the problem we set out to solve?
- Does it work the way users expect?
- Would you ship this?
- Would you want to maintain this?

---

## Document everything

Don't filter findings based on what you think is important:
- Capture everything.
- Let humans prioritize.
- What seems minor to you may be critical to stakeholders.

---

## Quality checklist

**Before implementation**
- [ ] Dependencies satisfied.
- [ ] Code examples match codebase.
- [ ] Patterns aligned with architecture.
- [ ] No unresolved questions.

**After implementation**
- [ ] All acceptance criteria met.
- [ ] Tests passing (meaningful ones).
- [ ] Automated checks passing (lint, type check, build).
- [ ] Code follows patterns.
- [ ] Self-review complete.
- [ ] Documentation updated.

**For validation**
- [ ] Subject and standard clearly identified.
- [ ] All aspects reviewed.
- [ ] Findings documented.
- [ ] Follow-up items for critical findings.

---

## Key questions

- Does this satisfy the requirement's intent, not just the letter?
- Are there gaps between what was asked and what was built?
- What assumptions did we make?
- What could we have missed?
- Would you ship this?

---

## Output

A clean report:

```
## Formula compliance
- Criterion 1: met (evidence)
- Criterion 2: unmet — Critical (gap, recommended fix)
- ...

## Prep compliance
- WI 1.1: built, criteria met
- WI 2.3: built, but added behavior X without a pivot — Major
- ...

## Quality
- Critical: 0
- Major: 1 (file:line — issue, recommendation)
- Minor: 3 (listed)

## Verdict
- [ ] Clean — zero Critical, zero Major
- [x] Not clean — fix Major in WI 2.3 before walking away
```

---

## Anti-patterns

- **Filtering findings.** Document everything. Let humans prioritize.
- **Self-verification without review.** Fresh eyes catch what you missed.
- **Partial verification.** Wait until complete. Partial creates false confidence.
- **Validating moving targets.** Wait for it to stabilize. If formula changes mid-clean, that's an `/pivot`.
- **"Tests pass so we're good."** Tests passing is necessary but not sufficient.
- **Verifying in main context.** Use sub-agents for checks. Don't waste tokens.

---

## Persist

Verification reports exist only in conversation until saved. If the findings are significant — especially for work that will continue across sessions — save them to `.camp/clean-<scope>.md`.

---

## Next

Clean? `/camp` to seal the session. Not clean? Back to `/pull` for the Major findings. If the formula itself slipped — that's `/pivot`, not another verification pass.

---

Walking away clean isn't about perfection. It's about knowing exactly what you've got.
