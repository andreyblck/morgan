# Verification

Verify everything. Validate against intent. Close every loop.

Loaded by `/clean`.

---

## The point

Catch issues before they compound. Validate early, verify often. Close the traceability loop from requirement to implementation.

---

## Three distinct concepts

**Review** — check before implementation.
- Are code examples correct?
- Are dependencies satisfied?
- Do patterns align?

**Validation** — check alignment.
- Does this artifact match its governing spec?
- What's covered? What's missing?

**Verification** — confirm completion.
- Does the implementation satisfy the requirement's *intent*?
- Tests passing is not the same as "done right."

Don't conflate them. They look similar but operate at different points in the lifecycle.

---

## The traceability loop

```
Requirement → Work Items → Implementation → Tests → Verification
```

Close the loop — confirm the requirement has been implemented, tested, and validated against its intent. Loose ends in this chain are how broken work ships.

---

## Work item review

Do this *before* implementation. Every time.

1. **Understand the work item** — description, criteria, dependencies, code examples.
2. **Validate dependencies** — are referenced work items complete? No circular deps?
3. **Review code examples against the codebase:**
   - Method names match implementations?
   - Field names match schemas?
   - Imports valid?
   - Signatures match contracts?
4. **Question for truth:**
   - Why does this exist? Is it necessary?
   - Is this the simplest solution?
   - What assumptions are we making?
5. **Check integration patterns:**
   - Architectural alignment?
   - Error handling consistent?
   - Testing approach matches?
6. **Document issues** by category (Critical / Major / Minor / Missing).
7. **Decide action** — change request for critical, fix minor during implementation.

---

## Alignment validation

Does this artifact match its governing spec? Check systematically.

1. **What are you validating, and against what?** Be specific.
2. **Check coverage** — what's covered? What's missing?
3. **Check consistency** — any contradictions?
4. **Check completeness** — all required elements present?
5. **Classify findings** — missing, misaligned, incorrect, incomplete, unclear.
6. **Route to humans** — they adjust severity and prioritize.
7. **Create follow-up items** for critical findings.

---

## Requirement verification

Trace from requirement to code. Don't assume — prove it.

1. **Confirm implementation exists.** Can you trace from requirement to actual code?
2. **Validate acceptance criteria.** Tests exist, tests pass, behavior matches intent.
3. **Get human sign-off.** "Does this satisfy the requirement?" Tests passing is necessary but not sufficient.
4. **Update status** with actor and timestamp.
5. **Close the loop** — requirement → implementation → tests → verified.

---

## Questions that reveal truth

- Why does this exist? Is it necessary?
- Does this follow established patterns? Why not?
- Is this the simplest solution? What could be removed?
- What assumptions are we making?
- Who will use this in production?

Ask every one. Questions aren't criticism — they reveal what's actually true.

---

## Code review

Review the actual code, not just the tests.

**Self-review** — before calling anything done:
- Would you approve this PR if someone else submitted it?
- Does it follow existing patterns?
- Are edge cases handled?
- Is error handling complete?
- No commented-out code, no debug statements, no hardcoded credentials?

See the `building` reference for the detailed self-review checklist.

**Peer review** — fresh eyes catch what you missed:
- Does the code match the requirement's intent, not just pass tests?
- Are there simpler approaches?
- Will the next person understand this without explanation?
- What assumptions did the author make?

Code review isn't gatekeeping — it's a quality signal. The questions that reveal truth apply here too.

---

## Use sub-agents for review

You wrote the code. You're the worst possible reviewer of it.

- **Charles** — default reviewer. Codebase patterns, criterion checklist, evidence-based findings.
- **Sadie** — when security or operational risk is the angle.
- **Lenny** — when architectural integrity needs review.
- **Tilly** — when UI needs visual / keyboard QA. Or invoke `/qa` directly.

Brief them with the formula and prep. Tell them to check criteria one by one and classify findings:

- **Critical** — must fix. Broken behavior, security, data risk, formula criterion unmet.
- **Major** — should fix. Anti-pattern, missing error handling, significant test gap.
- **Minor** — could fix. Style, naming, doc gap.

Validate their output. Sub-agents can hallucinate or misclassify.

---

## Anti-patterns

- **Filtering findings.** Document everything. Let humans prioritize. Don't decide what's minor — that's a stakeholder call.
- **Skipping automated checks.** Run lint, type check, and build before calling self-review complete. Manual review covers intent; automated checks cover correctness.
- **Skipping human review.** Route findings to humans. Don't auto-prioritize. Automated checks find issues; humans judge them.
- **Self-verification without review.** Don't mark verification complete without human sign-off. Someone must confirm intent is satisfied.
- **Verifying partial implementations.** Stop. Wait until complete. Partial verification creates false confidence.
- **Validating moving targets.** Wait for the subject to stabilize before validating. If the formula changes mid-`/clean`, that's an `/pivot` — re-verify.
- **Ignoring terminology.** Use one name for one thing. Enforce it across the project.

---

## Quality checks

**Work item review**
- [ ] All referenced work items completed.
- [ ] Parent feature active and not blocked.
- [ ] No circular dependencies.
- [ ] Method names match implementations.
- [ ] Field names match schemas.
- [ ] Patterns followed.
- [ ] Architectural patterns aligned.
- [ ] Error handling consistent.

**Validation report**
- [ ] Subject and standard clearly identified.
- [ ] All aspects of standard reviewed.
- [ ] All findings documented (regardless of severity).
- [ ] User reviewed and confirmed findings.
- [ ] Recommendations stated.
- [ ] Follow-up items created for critical findings.

**Verification**
- [ ] Implementation trace exists.
- [ ] Acceptance criteria validated.
- [ ] Automated checks passing.
- [ ] Human sign-off obtained.
- [ ] Verified timestamp and actor recorded.
