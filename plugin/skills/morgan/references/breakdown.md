# Breakdown

Break big things into small things.

Loaded by `/case`.

---

## The point

Convert plans into deliverable pieces. Each level creates just enough detail for the next. Don't create everything upfront — build the right thing, at the right time, in the right order.

---

## The hierarchy

```
Plan → Phases → Features → Work Items → Subtasks
```

Each level prescribes what must be created at the next. Names don't matter — the pattern does.

---

## Phases

Delivery phases with exit criteria.

**Purpose:** bridge between high-level plan and tactical work. Represent coherent phases of value delivery.

**Defined by:** exit criteria, not dates.

**Contains:** multiple features that together achieve the phase.

### Creating phases

1. What outcomes must this phase deliver?
2. What features deliver those outcomes?
3. What must exist before starting?
4. What's the critical path?

---

## Features

Outcome-oriented slices of value.

**Purpose:** group related work into capabilities. Bridge between phases and executable work.

**Contains:** work items that together deliver the outcome. Plus acceptance criteria beyond individual work-item completion.

### Creating features

1. What value does this deliver when complete?
2. What's IN scope? What's explicitly OUT?
3. What work items deliver this outcome?
4. Beyond completing work items, what must be true?

---

## Work items

Executable pieces of work.

**Purpose:** enough detail for autonomous implementation.

**Contains:** acceptance criteria, implementation guidance, test approach.

**Sized by:** complexity points, not time. If it's too big, split it.

### Creating work items

1. What's the concrete, testable behavior?
2. What are the error cases and edge cases?
3. What existing patterns should be followed?
4. What tests prove this works?

### Work item components

- **Acceptance criteria** — specific, testable conditions.
- **Implementation guidance** — approach, similar patterns, code examples.
- **Test approach** — unit, integration, manual; specific test data if needed.
- **Dependencies** — what must exist first.
- **Traceability** — what scope/requirement this delivers.

Every work item must trace back to what it's delivering. Not heavy linkage with IDs — just clarity on why this work exists and what success criteria it satisfies.

---

## Subtasks

Technical work that supports a work item.

**Purpose:** infrastructure, refactoring, migrations, or breaking down complex work items.

**Contains:** success criteria focused on technical outcomes.

---

## Spikes

Timeboxed research.

**Purpose:** answer questions before committing to implementation.

**Key principle:** spikes are questions, not answers. Every spike must inform a real decision.

**Timebox:** 15 min to 4 hours max. Over 4 hours? Split it, or it's feature-level work.

### Creating spikes

1. What specific question needs answering?
2. Has this been answered elsewhere?
3. What decision will this inform?
4. Can this be answered within the timebox?

### Executing spikes

1. Execute within timebox — stop when time expires.
2. Make a clear recommendation — don't just present options.
3. Document findings with evidence.

---

## Complexity assessment

Estimate complexity, not time. Time varies; complexity is inherent to the work.

**Complexity factors:**
- How many things need to change?
- How many unknowns exist?
- How many integration points?
- How much existing code needs understanding?
- How much could go wrong?

**Rough scale:**

| Points | Meaning | Signals |
|---|---|---|
| 1–2 | Trivial | Single file, known pattern, obvious approach |
| 3–5 | Moderate | Few files, some unknowns, clear shape |
| 5–8 | Significant | Multiple components, integration points, requires investigation |
| 8+ | Too big | Split it. You can't hold this in your head. |

**Split when:**
- You can't explain the approach in a few sentences.
- Multiple independent outcomes are bundled together.
- You'd need to context-switch within the work.
- Risk is concentrated — one failure tanks everything.

**Don't over-split:**
- Splitting adds overhead (context, handoffs, integration).
- Some things are genuinely complex and need to stay together.
- If splitting creates more coordination than it saves, keep it whole.

---

## Sequencing

Order matters. Wrong sequence creates blockers, wasted work, integration pain.

**Principles:**

**Dependencies first.** What unblocks the most? Build foundations before features. Don't start what you can't finish.

**Risk early.** Tackle uncertain things first, while there's time to adapt. Don't push the scary parts to the end.

**Value early.** Deliver usable increments. Something working beats everything almost working.

**Learn early.** If a spike might change the approach, run it before building on assumptions.

**Think in layers.** Work naturally falls into layers, and each layer creates conditions for the next to be verifiable. Environment (config, tooling, quality gates) → structure (types, schemas, interfaces) → implementation (code, content, assets) → refinement (optimization, polish). You can't verify code without a build system. You can't catch mistakes without quality tooling. You can't implement without types. You can't refine what doesn't exist. Sequence accordingly.

**Sequence for flow:**
1. What layer does this work live in? (Environment → Structure → Implementation → Refinement)
2. What must exist before anything else? (Foundation)
3. What reduces the most uncertainty? (Risk / Learning)
4. What unblocks the most other work? (Critical path)
5. What delivers usable value soonest? (Incremental delivery)

**Watch for:**
- Circular dependencies (A needs B needs A) — break the cycle.
- Long chains of sequential work — parallelize where possible.
- All risk at the end — front-load uncertainty.
- Integration last — integrate continuously, not at the end.

---

## Refinement

Run multiple focused passes. Each catches different issues.

| Pass | Focus | Catches |
|---|---|---|
| **Architecture** | Technical consistency | Conflicts, duplicates, missing components |
| **Capability** | Completeness | Missing criteria, error handling, NFRs |
| **Dependency** | References | Broken links, circular deps, blocking order |
| **Clarity** | Understanding | Terminology, ambiguity, assumed knowledge |
| **Sequence** | Practicality | Implementation order, quick wins, risk distribution |

---

## Anti-patterns

- **Vague criteria.** "Auth is done" vs "User can log in with email/password."
- **No scope boundaries.** Not defining OUT invites creep.
- **Too much complexity.** More than 8 points at any level = too big to hold in your head. Split it.
- **Calendar dates instead of exit criteria.** "Due March 15" vs "All acceptance criteria met."
- **Creating all detail upfront.** Don't decompose everything at once. Just-in-time.
- **Work items without patterns.** No reference to existing code = guesswork during implementation.
- **Spike without decision.** Research that doesn't inform a real decision is waste.
- **Oversized work items.** If you can't hold it in your head, split it.

---

## Quality checks

**Phases**
- [ ] Exit criteria are specific and measurable.
- [ ] Features identified to cover all criteria.
- [ ] Dependencies documented.
- [ ] Risks identified with mitigations.

**Features**
- [ ] Outcome delivers clear value.
- [ ] Scope boundaries explicit (IN and OUT).
- [ ] Work items cover all acceptance criteria.
- [ ] Complexity estimated.

**Work items**
- [ ] Acceptance criteria specific and testable.
- [ ] Happy path, errors, edge cases covered.
- [ ] Implementation guidance with code examples.
- [ ] Similar patterns in codebase referenced.
- [ ] Test approach defined.

**Spikes**
- [ ] Question is specific and answerable.
- [ ] Answer doesn't already exist.
- [ ] Timebox is realistic.
- [ ] Decision this informs is identified.
