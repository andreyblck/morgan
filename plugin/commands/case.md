---
name: case
description: Decompose the formula into right-sized work items with exit criteria.
argument-hint: "[formula]"
---

# /case

Case the joint before you pull it.

---

## Intent

You're converting a defined scope into work that can be executed. Not creating busywork. Not over-engineering the breakdown. Right-sized decomposition that gives `/pull` exactly what it needs.

---

## Load skill

Load the `morgan` skill first. Then read its `breakdown`, `scoping`, and `verification` references.

---

## Start

$ARGUMENTS

If no formula was specified, STOP and use the AskUserQuestion tool to ask: What scope are we decomposing? Point me to the formula, spec, or scope document. If none exists, use `/scope` first.

---

## Pre-flight

Before decomposing:

### 1. Verify the formula

- [ ] Problem is clearly defined.
- [ ] Scope boundaries are explicit (IN and OUT).
- [ ] Success criteria are measurable.
- [ ] Constraints and risks are identified.

If any are missing, stop. Use `/scope` to complete the formula.

### 2. Research with sub-agents

Spawn sub-agents to explore in parallel. Don't waste context on exploration.

**Sub-agent tasks:**
- Survey the codebase for existing patterns (specify the feature areas and directories to examine).
- Identify similar features and how they were structured (name the behaviors to match against).
- Find dependencies that will affect sequencing (list the modules and integration points to check).
- Assess technical complexity of key components (point to the specific files or systems).

**Brief each sub-agent with:**
- The scope being decomposed so they understand what's relevant.
- Specific directories, modules, or file patterns to search.
- Expected output: file paths, structural patterns (how similar features are organized), dependency chains, and complexity flags (what's straightforward vs what has unknowns).

**After collection:**
- Verify structural claims by spot-checking key files. Sub-agents can misrepresent how features are organized or miss dependencies.
- Use findings to inform the breakdown: which patterns to follow, what dependencies drive sequencing, where complexity lives.

---

## Assess scale

Not everything needs phases. Right-size the decomposition.

| Scale | Signals | Decomposition |
|---|---|---|
| **Simple** | Single concern, clear path, < 8 points total | Work items only |
| **Moderate** | Multiple concerns, some unknowns, 8–20 points | Features → work items |
| **Complex** | Multiple phases, significant unknowns, 20+ points | Phases → features → work items |

**Ask:**
- How many distinct outcomes are we delivering?
- Are there natural phase boundaries (foundation → core → polish)?
- Can one person hold the whole thing in their head?

If in doubt, start with features. Add phases only if needed.

---

## The process

### 1. Identify outcomes

What distinct capabilities or results does this formula deliver?

Each outcome becomes a **feature** (or a phase, if large enough).

**For each outcome:**
- What value does it deliver when complete?
- What's IN scope? What's explicitly OUT?
- How do we verify it's done?

### 2. Create phases (if needed)

Only for complex work with natural boundaries.

**A phase needs:**
- Clear exit criteria (not dates).
- Multiple features that together achieve the phase.
- Dependencies on prior phases (or none, for phase 1).

**Common phase patterns:**
- Foundation → Core → Polish.
- Infrastructure → Features → Integration.
- MVP → Enhancement → Scale.

### 3. Create features

Group related work into outcome-oriented slices.

**A feature needs:**
- **Outcome** — what value this delivers when complete.
- **Scope** — what's IN, what's explicitly OUT.
- **Acceptance criteria** — beyond individual work items, what must be true?
- **Complexity estimate** — points (1–8 per feature level).

### 4. Create work items

Break features into executable pieces.

Cut across the layers, not along one. A work item runs one narrow path through the system and works when it's finished — someone can exercise it end to end. An item shaped like a layer ("add the types", "build the schema", "wire the UI") finishes with nothing working, so nothing gets verified until the last one lands and every integration problem shows up at once. Layers order the build *inside* a slice; they're not how you cut items. See the shape rule in the `breakdown` reference.

**A work item needs:**
- **Acceptance criteria** — specific, testable conditions.
- **What works when it's done** — one line naming what a caller can do that they couldn't before. If the honest answer is "nothing yet, the next item needs it," recut.
- **Implementation guidance** — approach, patterns to follow, code examples.
- **Test approach** — how to verify (unit, integration, manual).
- **Complexity** — points (1, 2, 3, 5, 8 — split anything larger, across the path rather than into its layers).
- **Dependencies** — what must exist first.

Subtasks are the exception — a migration, a dependency upgrade, a build fix genuinely leaves nothing user-visible. Fine on its own; not fine as the shape of the whole plan.

**Quality check each work item:**
- [ ] Can I name what works when this is done?
- [ ] Can I explain what "done" looks like?
- [ ] Do I know the approach (not every line, but the shape)?
- [ ] Are there existing patterns to follow?
- [ ] Do I know how to verify it?

If you can't answer these, the work item isn't ready.

### 5. Handle unknowns

When you hit uncertainty:

**Create a spike** (timeboxed research):
- Specific question to answer.
- Timebox (15 min to 4 hours, max).
- Decision it will inform.

Spikes go first in the sequence. Don't build on assumptions.

### 6. Sequence the work

Order matters. Wrong sequence creates blockers and wasted work.

**Principles:**
1. **Value early** — order the slices so something usable exists as soon as possible. Not "when possible" — first.
2. **Dependencies first** — what unblocks the most, given each item still stands up on its own?
3. **Risk early** — uncertain things while there's time to adapt.
4. **Learn early** — spikes before building on assumptions.
5. **Layers order the build inside a slice** — environment first and once (build, lint, type check, tests), then structure → implementation → refinement within each path. Not a way to cut items.

**Watch for:**
- Circular dependencies (break the cycle).
- Long sequential chains (parallelize where possible).
- All risk at the end (front-load uncertainty).

### 7. Refine

Multiple passes catch different issues:

| Pass | Focus | Catches |
|---|---|---|
| **Architecture** | Technical consistency | Conflicts, duplicates, missing components |
| **Capability** | Completeness | Missing criteria, error handling, edge cases |
| **Dependency** | References | Broken links, circular deps, blocking order |
| **Clarity** | Understanding | Vague language, assumed knowledge |

### 8. Get explicit approval

Before proceeding to `/pull`:
- Confirm the breakdown captures all success criteria.
- Confirm sequencing makes sense.
- Confirm complexity estimates are realistic.
- Confirm nothing critical is missing.

Not "looks good." Explicit approval. This is the work plan.

---

## Output

When complete, you should have:

**For each phase** (if applicable):
- Exit criteria.
- Features included.
- Dependencies.

**For each feature:**
- Outcome statement.
- Scope (IN / OUT).
- Acceptance criteria.
- Work items.

**For each work item:**
- Acceptance criteria.
- What works when it's done.
- Implementation guidance.
- Test approach.
- Complexity points.
- Dependencies.
- Sequence position.

**Spikes** (if any):
- Question to answer.
- Timebox.
- Decision it informs.
- Position in sequence (usually first).

**Basis** footer — two or three lines on what the breakdown leans on (the formula, codebase patterns surfaced by sub-agents, dependencies that drove sequencing) and why the work's shaped this way.

This is the breakdown.

---

## Where to capture

Right-size the rigor. Don't default to global config space or system plan files — use `.camp/` or wherever the user specifies. The user's project, the user's call.

| Project size | Capture method |
|---|---|
| Quick feature | Mental model or checklist in chat |
| Moderate feature | Work items in CLAUDE.md or task list |
| Significant initiative | Scope doc with phases / features / work items |
| Multi-phase project | Dedicated planning docs |

Don't over-document. Don't under-document.

---

## Persist

Save to `.camp/case.md` by default. The breakdown is what `/pull` executes against and what `/clean` verifies against — if it's not saved, downstream commands have nothing to reference.

---

## Anti-patterns

- **Decomposing without a formula.** If scope isn't clear, you're not decomposing — you're guessing. Use `/scope` first.
- **Creating all detail upfront.** Don't decompose phase 3 while you're still in phase 1. Just-in-time detail.
- **Calendar dates instead of exit criteria.** "Due Friday" tells nothing. "All acceptance criteria met" is done.
- **Vague acceptance criteria.** "Auth works" vs "User can log in with email/password; invalid credentials return 401."
- **8+ point work items.** Too big to hold in your head. Split.
- **Layer-shaped work items.** "Add all the types," "build the schema," "wire the UI" — each passes every check above and leaves nothing working. Nothing is verified until the last one lands.
- **No scope boundaries.** Not defining OUT invites creep.
- **Skipping spikes.** Building on assumptions is how you pivot late.
- **Work items without patterns.** No reference to existing code = guesswork during implementation.
- **Over-decomposing simple work.** A bug fix doesn't need phases and features. Right-size it.

---

## Next

Prep's clean. `/pull` the first item. When the feature's done, `/clean` it.
