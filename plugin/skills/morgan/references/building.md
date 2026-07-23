# Building

How to build to spec without drifting.

Loaded by `/pull`.

---

## The point

Transform specs into working code through disciplined, incremental implementation. Every piece tested, every commit meaningful, every criterion verified.

---

## Core discipline

### Verify before acting
- Read everything before writing code.
- Confirm dependencies are satisfied.
- Identify unknowns and resolve them first.
- Verify the development environment is ready.

### Work incrementally
- One logical change at a time.
- Test after each change.
- Commit at logical boundaries — a completed work item or a coherent part of a feature.
- Review before committing — use sub-agents for verification when scope warrants.

### Follow existing patterns
- Use consistent naming with the codebase.
- Match established code patterns.
- Don't introduce new patterns unless necessary.

### Stay within scope
- Implement the acceptance criteria, nothing more.
- Don't refactor unrelated code during implementation.
- Pragmatic cleanup of code you're touching (DRY, KISS, clear naming) is craft, not creep.
- Don't add features beyond what was asked.

---

## The TDD cycle

When appropriate (business logic, algorithms, APIs, service methods):

1. **Write the test** for the criterion, run it, and confirm it fails for the reason you expect.
2. **Write the best implementation** — not just enough to pass the test.
3. **Iterate** if tests fail or quality isn't right.
4. **Repeat** for the next criterion.
5. **Run automated checks** — lint, type check, build.
6. **Review and commit** at the logical boundary — one coherent unit.

TDD does not apply to: environment setup, config files, schema definitions, UI layout, third-party integrations.

---

## What a test has to prove

A passing test is not evidence. A test is evidence when it would have caught the thing it claims to protect against — and a test that cannot fail passes the suite, passes review, and gets reported as correctness. Four conditions, and one missing is enough.

**It was seen failing.** Run it before the implementation exists and read the failure. Not just that it went red — that it went red for the reason you expect. A test that fails because the module doesn't import yet has said nothing about the behaviour you're specifying. If it passes before you write the code, either the behaviour already exists or the test doesn't reach it. Find out which.

**The expected value came from somewhere other than the code under test.** An acceptance criterion, an example worked by hand, a known-good figure, a value the spec fixes. If the only way to know the answer is to run the code — or to rebuild its algorithm inside the test — the test restates the implementation and will agree with it forever, including when it's wrong. Snapshots and golden files are the exception by construction: their expected value is generated, so the discipline moves to reading the recorded output the first time, and treating every later change to it as a claim that needs a reason.

This one bites hardest where there's nothing to test against — old code, no spec, no ticket, nobody left who remembers. The pull is to run it, paste what came back, and call that a test. Do the work instead: read the code, state the rule it appears to implement, and compute each expectation from that rule. Where a value only exists because the code produces it, say so on the line and say which way you'd expect it to go if someone ever wrote the requirement down. A suite that pins present behaviour is worth having — it catches drift — but it certifies nothing, and the difference has to be visible to whoever reads it next. Name the values you'd challenge rather than burying them among the ones you'd defend.

**It asserts through the same door the caller uses.** Set up through the public entry point, assert on what a caller can observe. Asserting on the private internals of the unit welds the test to today's implementation. The tell: a test that breaks under a change that altered no observable behaviour is a defective test — fix the test rather than preserve the shape it was pinning. Seeding a database, asserting persisted rows, or injecting a failure to reach an error path are ordinary setup, not violations.

**It substitutes only past a boundary you don't own.** The network, the clock, the filesystem, a third-party service, anything slow or nondeterministic — replace those. A collaborator inside your own code is part of what you're testing; replacing it leaves a test of your own wiring that stays green while the behaviour rots. When faking an internal piece feels necessary, that's usually the design talking.

This is a bar on what counts as a test, not on how many to write.

---

## Implementation flow

### Before starting

1. **Create branch** from latest main.
2. **Pre-implementation review:**
   - Read everything (spec, acceptance criteria, related code).
   - Check dependencies.
   - Verify environment — pre-commit hooks installed and running. If missing, set them up, then prove the guard bites: write a deliberate violation of the rule you just installed, confirm the hook rejects it, revert. A hook that exits clean on everything looks identical to one that works.
3. **Create implementation checklist** from acceptance criteria.

### During implementation

4. **Implement** following the TDD cycle where appropriate.
5. **Follow existing patterns** in the codebase.
6. **Test and check continuously** — run tests after each change; run lint and type check before each commit.
7. **Review and commit at logical boundaries** — verify your work; use sub-agents when warranted.

### Before completing

8. **Self-review** — review your own PR. If you wouldn't approve it, don't submit it.
9. **Validate definition of done** — all criteria met?
10. **Update documentation** with what was built.
11. **Create PR or merge.**

---

## Pre-build validation — five questions

Before writing code, validate you're ready. Don't proceed until you can answer all five.

1. **Read the work item completely.** Criteria, guidance, dependencies.
2. **Check dependencies are satisfied.** Required pieces exist and work.
3. **Verify code examples.** Do method names, field names, patterns actually exist in the codebase?
4. **Identify unknowns.** Resolve anything unclear before implementation, not during.
5. **Confirm environment.** Can you run, test, and verify?

Catching misunderstandings here is cheap. Catching them after implementation is expensive.

For complex work (5+ points), consider a quick spike to validate the approach before committing.

---

## Bug fixes

Same discipline, tighter scope. Follow the bug-fix process in the `tracing` reference.

The key principle: minimal fix. Don't refactor unrelated code. Don't improve beyond the fix. But pragmatic cleanup of code you're touching is craft, not creep.

---

## Definition of done

Don't call it done until every item checks off:

- [ ] Code implemented following patterns.
- [ ] All acceptance criteria met.
- [ ] Tests written and passing.
- [ ] Automated checks passing.
- [ ] Code reviewed (self or peer).
- [ ] Documentation updated.
- [ ] No critical issues.
- [ ] Performance acceptable.

---

## When to ship

Done is better than perfect. But done means criteria met, not "I'm tired of this."

**Ship when:**
- All acceptance criteria are met.
- Tests pass and cover the important paths.
- You'd be comfortable debugging this at 2am.
- The next person can understand it.

**Don't ship when:**
- Known bugs exist (even minor ones add up).
- Tests are missing for core functionality.
- You're hoping no one looks too closely.
- "It works on my machine" is your confidence.

**Cut scope when:**
- You're gold-plating (adding polish beyond requirements).
- Nice-to-haves are blocking must-haves.
- Timeline pressure is real and criteria can be narrowed.
- Scope creep happened and you need to reset.

**Push through when:**
- You're almost there and stopping creates more work than finishing.
- The hard part is done; only cleanup remains.
- Cutting would leave something broken or unusable.
- Momentum matters and pausing would lose context.

**The test:** show this to a senior engineer. Not perfect — but solid, clean, meets requirements. If you'd hesitate, you're not done.

---

## Self-review checklist

Before calling it done, run every item. No exceptions.

**Automated checks**
- [ ] Lint passes.
- [ ] Type check passes.
- [ ] Build passes.
- [ ] Formatter applied.

**Code quality**
- [ ] No commented-out code.
- [ ] No debug print statements.
- [ ] Meaningful variable names.
- [ ] DRY principle followed.
- [ ] Error handling complete.
- [ ] Edge cases handled.
- [ ] No hardcoded paths.
- [ ] Tests portable across environments.

**Security**
- [ ] No hardcoded credentials.
- [ ] Input validation present.
- [ ] SQL injection prevented.
- [ ] No sensitive data logged.

**Performance**
- [ ] No N+1 queries.
- [ ] Appropriate indexes used.
- [ ] Caching where beneficial.
- [ ] Meets performance criteria.

---

## Anti-patterns

- **Big-bang implementation.** Implementing everything before testing. Stop. Work incrementally.
- **"I'll add tests later."** You won't. Write tests as part of implementation.
- **Giant commits with vague messages.** "Fixed stuff" tells nothing. One commit per work item with clear messages.
- **Acceptance criteria drift.** Implementing beyond scope. Stick to what was defined.
- **Over-fixing bugs.** Refactoring unrelated code during a bug fix. Pragmatic cleanup of what you're touching is fine.
- **Documentation lag.** Not updating docs with code. Document as you go.
- **Test coverage gaming.** Writing useless tests for coverage. Every test meets the four conditions above, or it isn't one.
- **AI attribution in commits.** Commit messages describe what changed and why, not who or what wrote the code. No co-author lines. Attribution adds noise and ages poorly.

---

## Key questions

**Before starting**
- Are all dependencies satisfied?
- Is the development environment ready?
- Do I understand what needs to be built?

If any answer is no, stop. Resolve before proceeding.

**During implementation**
- Does this follow existing patterns?
- Am I staying within scope?
- Have I tested this change?
- Is this work item complete enough to commit?

**Before completing**
- Are all acceptance criteria met?
- Do all tests pass?
- Do automated checks pass?
- Have I documented what I built?
- Would I approve this PR?

If any answer is no, you're not done.
