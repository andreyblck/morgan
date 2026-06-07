# Tracing

Systematic diagnosis.

Loaded by `/track`.

---

## The point

Find the root cause, not just the symptom. Fix it once, prevent it forever.

---

## Core principles

### Can't fix what you can't reproduce
Don't touch the code until you can reliably trigger the issue. Follow reproduction steps exactly. Note any variations.

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
   - Cannot reproduce → request more info.
   - Not a bug → close with explanation.
   - Feature request → convert to story.
8. **Update status** and document triage notes.

---

## Root cause analysis

Naming a cause is the start, not the end. A diagnosis is finished when the cause is *proven* — not when you've reached the bottom of a list.

1. **Trace the code path** from reproduction steps.
2. **Identify the exact failure point.**
3. **Understand WHY** — not just where.
4. **Check recent changes** — is this a regression?
5. **Prove the cause.** Demonstrate it produces the symptom — toggle it and watch the symptom follow. A cause you can't reproduce on demand is still a theory.
6. **Rule out the competitors.** Name at least one alternative explanation and kill it with evidence. The first plausible cause is a suspect, not a verdict.
7. **Account for everything.** The cause explains every symptom and the whole timeline, not just the convenient ones. One unexplained symptom means keep digging.
8. **State your confidence** — Confirmed / Strong theory / Working theory / Inconclusive. Only *Confirmed*, where the evidence directly proves the cause, earns a fix. Anything less, keep going.
9. **Document clearly** — future fixers need context.

---

## Bug fix

1. **Verify reproduction.** Follow steps exactly.
2. **Confirm root cause.** Clear all four conditions of the certainty gate: it reproduces (run the toggle, don't imagine it), it accounts for every symptom and the timeline, every competing theory is ruled out with evidence, confidence is *Confirmed*. A named cause is not a proven one — don't fix until all four hold.
3. **Write failing test** that reproduces the bug.
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
