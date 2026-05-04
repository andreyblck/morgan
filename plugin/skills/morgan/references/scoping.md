# Scoping

Think before you build. Every time.

Loaded by `/scope`.

---

## The point

Planning is thinking, not paperwork. Understand deeply before building. A plan isn't done until a new contributor can explain:

- Why this work exists.
- What problem it solves.
- What's IN scope versus OUT.
- What constraints frame the work.
- What success looks like.

If those five aren't clear, planning isn't done — no matter how many pages of doc exist.

---

## The hierarchy

1. **Problem definition** — why does this matter?
2. **Scope and boundaries** — what's IN, what's OUT?
3. **Success criteria** — how do we know we're done?
4. **Constraints** — what must always be true?
5. **Risks** — what could go wrong?

Everything flows from problem definition. Skip it and the rest falls apart.

---

## Phase 1 — Understand context

Gather this before defining anything. Don't skip it.

**User context**
- Technical competency — can they maintain code themselves?
- Build vs buy preference — own it or use services?
- Budget constraints — time, money, ongoing maintenance?

**Technical context**
- Existing infrastructure — what's already in place?
- Quality tooling — linters, type checkers, formatters, pre-commit hooks, CI?
- Team capabilities — who will maintain this?
- Current pain — what's broken or missing today?

---

## Phase 2 — Define the problem

Through conversation. Keep pushing until you have real answers.

1. **Understand deeply** — keep asking why.
2. **Quantify impact** — "X% of time spent on Y" beats "we lose time."
3. **Challenge assumptions** — what's *really* needed?
4. **Identify the real problem** — not just symptoms.

### Key questions

- What problem are we solving?
- How do we know it's a problem? (Quantify it.)
- What happens if we don't solve it?
- Is this the real problem, or a symptom?

If you can't say the answer in three sentences without "just" or "simply," you're not ready.

---

## Phase 3 — Define scope

**IN** — explicitly state what's included.
**OUT** — explicitly state what's excluded.
**Future phases** — where deferred items go.

Not defining what's OUT invites creep.

### Key questions

- What must be IN for this to be useful?
- What's explicitly OUT?
- What's deferred to future phases?
- Where are the boundaries?

---

## Phase 4 — Define success

Every criterion must be:
- **Specific** — no vague words.
- **Measurable** — you can verify it without ambiguity.
- **Achievable** — grounded in reality, not aspiration.

| Bad | Good |
|---|---|
| "Performance is acceptable" | "Response time < 200ms p95 on staging" |
| "Users like it" | "80% task completion in usability testing" |

### Extracting requirements

Success criteria are the starting point. Requirements extraction is the discipline of turning them into testable commitments.

**The thinking:**
- Each requirement is **independent** — testable on its own.
- Each requirement is **verifiable** — you can prove it's met.
- Each requirement is **traceable** — links back to the problem it solves.

**At any scale:**

| Scale | What it looks like |
|---|---|
| Weekend | Mental checklist: "It needs to do X, Y, Z" |
| Feature | Bullet points — specific behaviors to verify |
| Project | Requirements list — numbered, testable, traced to scope |
| Enterprise | Formal requirements — IDs, categories, acceptance tests |

**The process (scale up or down):**
1. Look at scope — what did we agree to build?
2. Pull out testable statements — "User can X," "System does Y."
3. Check independence — can each be verified separately?
4. Check coverage — does this cover the scope? Anything missing?
5. Check for hidden requirements — error handling, edge cases, performance.

**Stop when:**
- Someone else could verify each requirement.
- Requirements cover the scope (no gaps).
- Requirements don't overlap (no duplicates).
- Each traces back to why it matters.

Don't over-formalize for small work. But do the *thinking* every time — even for a weekend project. "What specifically must be true when this is done?"

---

## Phase 5 — Identify constraints

**Invariants** — rules that must ALWAYS hold. Use "must never" or "must always" language.
- Violation causes serious harm (data loss, security breach, system failure).
- Must be enforceable (validation, constraint, test).
- Examples: "Balance must NEVER be negative." "Auth tokens must ALWAYS be encrypted."

**Decisions** — choices already made. Locked, even if you'd choose differently in a vacuum.

**Dependencies** — what must exist first.

**Risks** — what could go wrong.

### Key questions

- What must ALWAYS be true? What must NEVER happen?
- What's already been decided?
- What do we depend on?
- What could go wrong?

### Handling risks

Identifying risks isn't enough. Assign a strategy to every one.

| Strategy | When to use | Example |
|---|---|---|
| **Mitigate** | Risk is likely and impact is high | Add validation to prevent bad data |
| **Accept** | Risk is low, or cost to address exceeds impact | Edge case that's unlikely and recoverable |
| **Avoid** | Risk can be eliminated by changing approach | Choose proven library over custom implementation |
| **Transfer** | Someone else is better positioned to handle | Use managed service instead of self-hosting |

**For each significant risk:**
- What's the likelihood? (Low / Medium / High)
- What's the impact if it happens?
- What's the strategy? (Mitigate / Accept / Avoid / Transfer)
- If mitigating, what's the action?

**Front-load risky work.** If something might change the whole approach, learn that early — while there's time to adapt.

---

## Phase 6 — Explore solutions

Before committing to one approach:

1. **Research what exists** — OSS, SaaS, APIs.
2. **Understand priorities** — timeline, budget, risk tolerance.
3. **Present options with trade-offs** — not recommendations.
4. **Let the user weigh in** — they have context you don't.

Don't fall in love with the first idea.

---

## Phase 7 — Get explicit approval

Don't proceed without it.

- Not silence. Not "sounds good." Get a clear yes.
- Confirm the plan is ready before building anything.
- Changes after this point require explicit acknowledgment. No exceptions.

---

## The commitment point

Planning ends. Building begins. Know when you've crossed the line.

**Before commitment:** everything is fluid. Scope can shift. Requirements can change. You're still figuring it out.

**After commitment:** changes are explicit. Scope shifts require acknowledgment. You're executing against an agreed target.

**The moment:**
- "We've agreed on what we're building."
- "This is the scope. These are the requirements."
- "Changes from here are changes, not clarifications."

**At any scale:**

| Scale | What commitment looks like |
|---|---|
| Weekend | Mental note: "Okay, I know what I'm building" |
| Feature | Verbal agreement: "This is the scope, let's build it" |
| Project | Written scope — documented, shared, acknowledged |
| Enterprise | Formal baseline — locked, versioned, change-controlled |

**Why it matters:**
- Without a commitment point, scope creep is invisible.
- "Just one more thing" compounds until you're building something else.
- Changes aren't bad — *unacknowledged* changes are.

**Signs you've crossed it:**
- You've stopped asking "what should this do?" and started asking "how do I build this?"
- Adding something feels like a change, not a clarification.
- You could explain the scope to someone, and they could verify against it.

**After the commitment point:**
- New ideas go to "future" or require an explicit scope change (`/pivot`).
- Clarifications are fine; expansions are acknowledged.
- The scope document (or mental model) is the source of truth.

Don't over-formalize for small work. But recognize the *moment* every time — even solo, know when you've stopped exploring and started building.

---

## Anti-patterns

- **Skipping problem definition.** Lighter process doesn't mean lighter thinking.
- **Vague success criteria.** "It works" means nothing.
- **Solution-first thinking.** "Build me an API" before knowing what for.
- **Over-specification.** Implementation details when only behavior matters.
- **Scope creep by omission.** Not defining OUT invites everything in.
- **Unrealistic targets.** Aspirational numbers ungrounded in measurement.
- **Jumping to milestones.** Planning delivery before the problem is understood.

---

## Quality checks

Run these before leaving planning. Don't skip a section.

**Scope**
- [ ] IN-scope items explicitly stated.
- [ ] OUT-of-scope items explicitly stated.
- [ ] Future phases documented separately.

**Success criteria**
- [ ] Every criterion is measurable.
- [ ] Targets are achievable, not aspirational.
- [ ] Criteria map to the problem being solved.

**Feasibility**
- [ ] Technical approach is realistic.
- [ ] Resource needs are understood.
- [ ] Constraints are documented.
- [ ] Risks are identified with mitigations.

**Clarity**
- [ ] No vague words like "manages," "handles," "processes."
- [ ] Responsibilities are explicit.
- [ ] Boundaries are clear.
- [ ] Dependencies are documented.
