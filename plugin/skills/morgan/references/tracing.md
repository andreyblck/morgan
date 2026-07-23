# Tracing

Systematic diagnosis.

Loaded by `/track`.

---

## The point

Find the root cause, not just the symptom. Fix it once, prevent it forever.

---

## Core principles

### Can't fix what you can't reproduce
Don't touch the code until you can trigger the issue on demand — as a command you've run, not steps you've read. Follow the reproduction exactly, note the variations, and get that command working before you build a theory. For an intermittent failure, chase a higher failure rate rather than a clean repeat; a bug that fails one run in two is workable, one in a hundred isn't.

### Root cause over symptoms
A fix without understanding is a band-aid that will fail again. Understand WHY the failure occurs, not just WHERE.

### Triage is classification, not fixing
Get bugs into the right queue quickly. Assess, prioritize, classify. Stop investigating once classified — triage is not debugging.

---

## Bug lifecycle

```
New → Triaged → In Progress → Resolved → Closed
              ↘ Won't Fix
```

---

## Severity vs priority

These look similar but mean different things.

**Severity** — what's broken (impact).

| Severity | Criteria |
|---|---|
| Critical | System unusable, data loss, security breach |
| High | Major feature broken, no workaround |
| Medium | Feature impaired, workaround exists |
| Low | Minor issue, cosmetic, edge case |

**Priority** — when to fix (business context).

| Priority | Response |
|---|---|
| Critical | Drop everything, fix now |
| High | Fix this sprint |
| Medium | Schedule upcoming |
| Low | Backlog |

Severity describes impact. Priority considers business context, user count, workarounds, deadlines. Don't conflate them.

---

## Bug creation

Every bug report must enable anyone to reproduce and understand without additional clarification.

1. **Verify reproducible.** Can you trigger it reliably?
2. **Check for duplicates.** Does this already exist?
3. **Gather information:**
   - Reproduction steps (exact sequence).
   - Expected behavior.
   - Actual behavior.
   - Environment (browser, OS, versions).
   - Frequency (always, intermittent, specific conditions).
   - Workaround (if any).
4. **Assess severity** based on impact.
5. **Link related items.**

---

## Bug triage

1. **Review the report** — is it complete?
2. **Check for duplicates.**
3. **Verify reproduction** — can you trigger it?
4. **Assess severity** based on impact.
5. **Assign priority** considering business context.
6. **Preliminary root cause** — obvious? Or needs investigation?
7. **Determine next steps:**
   - Clear and fixable → assign to sprint.
   - Needs investigation → create spike.
   - Cannot reproduce → chase a failure rate first; still nothing, ask for access, a capture, or instrumentation.
   - Not a bug → close with explanation.
   - Feature request → convert to story.
8. **Update status** and document triage notes.

---

## Root cause analysis

Naming a cause is the start, not the end. A diagnosis is finished when the cause is *proven* — not when you've reached the bottom of a list.

1. **Reduce the case.** Cut one element at a time from the failing scenario — an input, a caller, a flag, a step — re-running after each cut. Stop when removing anything left turns it green. Everything still standing is a suspect worth your time; everything you cut was never part of the bug.
2. **Trace the code path** from the reduced case.
3. **Identify the exact failure point.**
4. **Line up the candidates.** Name three to five possible causes before testing any one of them, each written as a prediction that could be proven wrong. Testing the first idea you had is how you end up defending it.
5. **Understand WHY** — not just where.
6. **Check recent changes** — is this a regression?
7. **Prove the cause.** Demonstrate it produces the symptom — toggle it and watch the symptom follow. A cause you can't reproduce on demand is still a theory.
8. **Rule out the competitors.** Kill the candidates from step 4 with evidence, not with preference. The first plausible cause is a suspect, not a verdict.
9. **Account for everything.** The cause explains every symptom and the whole timeline, not just the convenient ones. One unexplained symptom means keep digging.
10. **State your confidence** — Confirmed / Strong theory / Working theory / Inconclusive. Only *Confirmed*, where the evidence directly proves the cause, earns a fix. Anything less, keep going.
11. **Document clearly** — future fixers need context.

---

## Bug fix

1. **Verify reproduction.** Follow steps exactly.
2. **Confirm root cause.** Clear all four conditions of the certainty gate: it reproduces (run the toggle, don't imagine it), it accounts for every symptom and the timeline, every competing theory is ruled out with evidence, confidence is *Confirmed*. A named cause is not a proven one — don't fix until all four hold.
3. **Write failing test** that reproduces the bug, at a seam that runs it the way it actually happened. Watch it fail before you fix anything. If no seam runs the real path, that's a finding about the structure — record it, fix the bug, raise it afterwards.
4. **Implement minimal fix** — fix the bug, nothing more.
5. **Verify fix:**
   - Test passes.
   - Reproduction steps no longer fail.
   - Full suite green.
6. **Add regression tests** for edge cases.
7. **Document the fix.**

---

## Patterns signal bigger issues

Multiple related bugs indicate systemic problems. Track patterns:
- Same module.
- Same type of error.
- Same time period.
- Same code path.

When patterns emerge, do a systematic review beyond individual fixes. Don't just fix the next ticket.

---

## Anti-patterns

- **Vague bug descriptions.** "Login doesn't work" vs "Login crashes with 500 error when entering invalid password."
- **Missing reproduction steps.** Cannot reproduce = cannot reliably fix. Don't proceed without them.
- **Skipping duplicate check.** Creates noise and wastes effort.
- **Severity inflation.** Not everything is critical. Inflate severity, and nothing gets prioritized correctly.
- **Fixing symptoms instead of causes.** A null check that papers over the real issue will fail differently later.
- **Accepting the first plausible cause.** The obvious answer is often wrong. Don't fix a cause you can only name — fix one you can prove. Default to skepticism until the evidence forces the conclusion.
- **Endless investigation during triage.** Triage classifies. Root cause unclear? Create a spike and move on.
- **No regression tests.** The bug will return without tests that prevent it.

---

## Key questions

**When creating**
- Can I reproduce this reliably?
- Is this a duplicate?
- What's the exact sequence to trigger this?
- What's the impact on users?

**When triaging**
- Is the report complete enough to act on?
- What's the severity based on actual impact?
- What's the business priority?
- Is root cause obvious or needs investigation?
- Is this part of a pattern?

**When fixing**
- Can I *prove* the root cause — reproduce it on demand, rule out the alternatives, reach Confirmed confidence? If not, I don't understand it yet. Keep digging.
- Am I fixing the cause or just the symptom?
- What regression tests prevent recurrence?
- What edge cases might have the same issue?
