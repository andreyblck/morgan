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

**Sized by:** complexity points, not time. If it's too big, split it — across the path, not into its layers.

### Shape: cut across the layers, not along one

A work item runs one narrow path through the whole system and works when it's finished. Someone can exercise it end to end, however small the slice.

An item shaped like a layer — "add the types", "build the schema", "wire up the components", "set up the job runner" — is finished when nothing works yet. Stack a few of those and nothing is verifiable until the last one lands, every integration problem arrives at once and late, and the thing you learn from running real work through the system arrives after you've committed to the design.

Layer thinking still holds. It tells you what has to exist inside a path, and in what order within that path. It doesn't tell you where to cut items.

The test on any item: when this is done, what can someone actually do that they couldn't before? If the honest answer is "nothing yet, but the next one needs it," the cut is wrong — put the narrow end-to-end path in one item and let it carry the slice of schema, contract and interface it needs.

Some work genuinely has none of this shape — a migration, a dependency upgrade, a build fix. That's a subtask, and subtasks are allowed to leave nothing user-visible. What isn't allowed is a whole plan made of them.

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

**Split along the path, not down through it.** Two narrower capabilities, each working on its own, beats a schema item plus an API item plus a UI item. If a slice can't be made narrower without ceasing to work, it's the right size even at high points.

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

**Layers order the work inside a path, not the items themselves.** Environment (config, tooling, quality gates) → structure (types, schemas, interfaces) → implementation (code, content, assets) → refinement (optimization, polish). You can't verify code without a build system, can't implement without types, can't refine what doesn't exist — so within a slice, that's the order you build in. What the layers don't license is a plan whose items *are* the layers. See the shape rule above: an item carries the slice of each layer it needs, and works when it's done.

Environment is the one real exception. Quality tooling and a working build come before the first slice, because nothing after them is verifiable without them — that's foundation, not a layer-shaped item.

**Sequence for flow:**
1. What must exist before anything else? (Foundation — build and quality tooling, once)
2. Which path delivers something usable soonest? (Incremental delivery)
3. What reduces the most uncertainty? (Risk / Learning)
4. What unblocks the most other work? (Critical path)
5. Within the chosen slice, what order do the layers demand? (Structure → implementation → refinement)

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
- **Layer-shaped work items.** "Add the types," "build the schema," "wire the UI" — each one finishes with nothing working, so nothing is verified until the last one lands. Cut across the path instead.

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
- [ ] Something works when this item is done — name what a caller can do that they couldn't before.
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
