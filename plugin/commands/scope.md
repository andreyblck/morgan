---
name: scope
description: Define the problem before building. Scope, success criteria, constraints.
argument-hint: "[goal]"
---

# /scope

Scope the problem before you draw the piece.

---

## Intent

You're defining what to build before building it. Challenge assumptions, scope properly, establish clear success criteria. Get the thinking right first; the rest follows.

---

## Load skill

Load the `morgan` skill first. Then read its `scoping` and `breakdown` references. If the task involves frontend, UI, or visual design, also read the `frontend-design` reference.

---

## Start

$ARGUMENTS

If no goal was specified, STOP and use the AskUserQuestion tool to ask: What are we building? What problem are we trying to solve?

**If `$ARGUMENTS` looks like a Linear ticket** (URL matching `linear.app/...` or a ticket key like `ABC-123`) **and a Linear MCP server is connected** (tools matching `mcp__linear-server__*` are available), fetch the ticket via the appropriate Linear MCP tool (`get_issue` or equivalent) and use its title, description, and acceptance criteria as the source of truth for problem definition. Quote the ticket fields verbatim into the formula's problem statement. If Linear MCP isn't connected, say so once and proceed with the user's plain-text description.

---

## The process

### 1. Understand the problem

Don't accept the first answer. Dig deeper.

**Ask:**
- What problem are we solving?
- How do we know it's a problem? Quantify it.
- What happens if we don't solve it?
- Is this the real problem or a symptom?

If you can't articulate the problem clearly, you're not ready to solve it.

### 2. Understand context

**Ask:**
- Who needs this?
- Who will maintain it?
- What exists already?
- What constraints are we working within?
- What's the budget — time, money, ongoing maintenance?

Context shapes everything. A solution for a funded startup differs from a weekend project.

### 3. Research with sub-agents

Spawn sub-agents to explore in parallel. Don't waste context on exploration.

**Sub-agent tasks:**
- Survey existing solutions (name the problem space, specify OSS/SaaS/API categories to search).
- Explore the codebase for related patterns (point to directories, name the domain or feature area).
- Identify technical constraints or dependencies (list the systems and boundaries to check).
- Research similar implementations for lessons learned (specify the type of solution to compare).

**Brief each sub-agent with:**
- The problem statement and context so they know what relevance looks like.
- Specific areas to search (directories, package registries, documentation sites).
- Expected output: options with trade-offs, not just a list of links. For codebase exploration: file paths, patterns found, and how existing code relates to the problem.

**After collection:**
- Verify claims about existing code by spot-checking key files. Sub-agents can misidentify patterns or hallucinate implementations.
- Synthesize into options with trade-offs for the user to evaluate.

### 4. Define scope

**Explicitly state:**
- What's IN scope.
- What's OUT of scope.
- What's deferred to future phases.

Not defining OUT is how scope creeps in. Be explicit.

### 5. Define success criteria

Every criterion must be:
- **Specific** — no vague words.
- **Measurable** — can verify completion.
- **Achievable** — grounded in reality.

Bad: "Performance is acceptable."
Good: "Response time < 200ms p95."

Bad: "Users like it."
Good: "80% task completion rate in usability testing."

### 6. Identify constraints and risks

**Constraints:**
- What must always be true? (Invariants.)
- What's already been decided?
- What do we depend on?

**Risks:**
- What could go wrong?
- What don't we know yet?
- What needs early validation?

For each risk, assign a strategy: **Mitigate** (likely + high impact), **Accept** (low likelihood or low impact), **Avoid** (eliminable by changing approach), or **Transfer** (someone else handles it). See `scoping` reference.

### 7. Explore solutions

Before committing:
- Present options with trade-offs (from sub-agent research).
- Let the user weigh based on their context.

Don't lock in solutions too early. Don't fall in love with your first idea.

### 8. Break it down

If scope is significant, decompose:
- What are the major phases?
- What features deliver those phases?
- What's the critical path?
- What can be parallelized?
- What's risky and needs early validation?

### 9. Get explicit approval

Before proceeding:
- Confirm problem definition.
- Confirm scope boundaries.
- Confirm success criteria.
- Confirm approach.

Not silence. Not "sounds good." Explicit approval. Changes after this point require explicit acknowledgment — see `/pivot`.

---

## Challenge everything

Always challenge:
- Vague requirements ("make it better", "improve performance").
- Missing success criteria (how do we know we're done?).
- Undefined scope (what's NOT included?).
- Solution-first thinking ("build me an API" without why).
- Unrealistic targets (aspirational, not grounded).
- Over-engineering (complexity beyond what's needed).

Your job is to find the holes before they become expensive.

---

## Output

When complete, you should have:
- Clear problem statement (the WHY).
- Explicit scope (IN, OUT, deferred).
- Measurable success criteria.
- Known constraints and risks (with strategies).
- Agreed approach.
- Breakdown (if scope is significant).
- Brief **Basis** footer — two or three lines on what the formula leans on (source material, sub-agent findings, constraints) and why this approach over the alternatives.

This is the formula.

---

## Persist

Save the scope document to `.camp/scope.md` by default. This is the governing document — `/case` decomposes against it, `/pull` executes against it, `/clean` verifies against it. It needs to survive the session.

If the formula is significant enough to share with the team or outlast the current work, ask about moving it to a permanent location. Don't skip this — a formula left in `.camp/` only survives as long as the directory does.

---

## Anti-patterns

- Skipping problem definition.
- Vague success criteria.
- Solution-first thinking.
- Scope creep by omission.
- Unrealistic targets.
- Jumping to implementation.
- Falling in love with the first idea.
- Researching in main context — use sub-agents, don't waste tokens.

---

## Next

Formula's locked. `/case` to break it down. If the work's small enough to hold in one head — skip ahead and `/pull` it directly. Otherwise `/case` first.
