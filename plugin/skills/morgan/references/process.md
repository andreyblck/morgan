# Process

Intuition over ceremony. Always loaded.

---

## The point

Senior engineers don't follow process by reading the manual. They've internalized why process exists, and they adapt it without thinking. This reference is that intuition — the things you reach for naturally once they're learned.

**Core insight:** process is the shape that makes thinking honest. The phases and artifacts aren't ritual — they exist to force decisions you'd otherwise skip. Skip the ceremony when you can do the thinking unaided. Use it when the thinking is what gets dropped first.

---

## Phase awareness

Know where you are. Each phase has a different question to answer.

| Phase | What matters | Done when |
|---|---|---|
| **Understanding** | Why this exists, what problem it solves | Can explain it to someone else without notes |
| **Scoping** | What's in, what's out, what success looks like | Boundaries are explicit |
| **Breaking down** | Pieces small enough to hold | Each piece has a clear "done" |
| **Building** | One piece at a time, tested | Acceptance criteria met |
| **Verifying** | Does it actually work? Did intent get met? | Would you ship this? |

One phase at a time. Each has its own question. Mixing them is how decisions slip past and scope drifts.

---

## Decomposition sense

Big things break into smaller things. Keep breaking until each piece is **holdable** — you can carry the whole piece in your head.

**The natural hierarchy:**
- **Outcome** — what value are we delivering?
- **Phases** — what coherent chunks get us there?
- **Features** — what capabilities deliver each phase?
- **Work items** — what specific pieces build each feature?

Stop decomposing when:
- You can explain what "done" looks like.
- You know the approach (not every line — the shape).
- You can verify it independently.

Too much complexity at one level (>8 points) = needs splitting. **Complexity, not count.**

---

## Scope readiness — five questions

Before decomposing, verify the scope is actually ready to be broken down. Don't proceed until you can answer all five.

1. **Is the problem clear?** Can you explain why it matters?
2. **Are boundaries explicit?** What's IN, what's OUT?
3. **Are success criteria testable?** Could someone else verify them?
4. **Are constraints known?** What must always or never be true?
5. **Is there commitment?** Are we past exploration?

If you can't answer those, stop. Go back to planning.

**Signs scope isn't ready:**
- "What exactly are we building?" keeps changing.
- Success criteria are vague ("it should be good").
- Every conversation reveals new requirements.
- You aren't sure what's IN versus OUT.

---

## Work readiness — five questions

A piece of work is ready to build when you can answer all five. Not most. All.

1. **What does done look like?** Specific, testable.
2. **What's the approach?** Not every line — the shape.
3. **What patterns exist?** Similar code in the codebase to match.
4. **How will you verify it?** Tests, checks, criteria.
5. **What must exist first?** Dependencies.

If you can't answer those, stop. Do more thinking, or run a spike.

**Signs work isn't ready:**
- Acceptance criteria are missing or vague.
- You don't know where to start.
- Dependencies are unclear.
- Similar patterns don't exist and the approach is uncertain.
- You don't know the project's lint, type-check, or build commands.

---

## Document to think

Writing isn't ceremony — it's thinking made visible.

**Write things down when:**
- Scope needs to be clear (brief, plan, boundaries).
- A decision has lasting impact (decision record).
- You're handing off to future-you or someone else.
- You need to track what's done versus what remains (checklist, status).

**Don't write things down when:**
- It's obvious and won't be forgotten.
- The code is the documentation.
- It would be stale before anyone reads it.

Right-size documentation to the project. A weekend hack needs a README. A multi-phase initiative needs scope docs and decision records.

---

## Artifacts — the universal concepts

Every project has the same underlying needs: a place to define what's being built, a place to track what's done, a place to record why decisions were made. The names and tools vary (JIRA, Linear, Notion, markdown, mental models) but the *concepts* are universal.

### What every project needs (in some form)

**Scope capture** — Something that says what we're building and what we're not. A brief, an epic description, a README section, or a conversation summary. Exists so everyone agrees on boundaries.

**Work tracking** — Something that says what needs doing and what's done. Tickets, issues, a checklist, a kanban board. Exists so work doesn't get lost and progress is visible.

**Decision records** — Something that captures why we chose this approach. ADRs, a Confluence page, a PR description, comments in code. Exists so future contributors understand and don't relitigate.

**Requirements** — Testable commitments. Acceptance criteria, a spec, "it should do X." Exists so you know when you're done.

**Invariants** — Rules that must always hold. Documented constraints, validation rules, tribal knowledge. Exists so critical things don't break.

**Spikes** — Timeboxed research. A ticket, a task, "spend 2 hours figuring out X." Exists so uncertainty gets bounded investigation instead of open-ended drift.

**Context / handoff** — Something that captures where we are and what's next. A status update, a session log, notes in the ticket. Exists so work can continue across people or time.

### Adapt to your workflow

| If you use | Scope lives in | Work lives in | Decisions live in |
|---|---|---|---|
| JIRA / Linear | Epic / Project | Stories / Issues | Comments or linked docs |
| GitHub | README or Issue | Issues / PRs | PR descriptions, ADRs |
| Notion / Docs | Planning doc | Task database | Decision log |
| Markdown | Brief file | Checklist or work items | Decision files |
| Mental model | Your head | Your head | Your memory (risky) |

The tool doesn't matter. The concepts do. Whatever captures scope, tracks work, and records decisions — use that.

### Principles

- **Right-size the rigor.** Weekend project — mental model. Team initiative — written scope. Enterprise system — formal specs.
- **Persist what would otherwise vanish.** If you'd forget it, write it down. If it's obvious, don't.
- **Refresh it or delete it.** Stale artifacts mislead more than missing ones.

---

## Criteria terminology

Three similar terms, three different scopes:

- **Success criteria** — what *solving the problem* looks like. Defined during planning. Answers: did we solve the problem we set out to solve?
- **Exit criteria** — what *complete* looks like for a phase. Defined during decomposition. Answers: can we move on?
- **Acceptance criteria** — what *done* looks like for a single work item. Defined during breakdown. Answers: does this specific piece work?

All three have to be specific, measurable, and verifiable. The difference is scope — problem level, phase level, work-item level. Don't confuse them. Don't merge them. Each works at its own level.

---

## Spike discipline

Uncertainty gets timeboxed research, not open-ended exploration.

**A spike needs:**
- A specific question to answer.
- A timebox (15 min to 4 hours — longer means it's feature work).
- A decision it will inform.

**Execute spikes:**
- Stop when the timebox expires.
- Make a recommendation, don't just present options.
- If inconclusive, either extend the timebox (with justification) or make a best-guess decision and own it.

Research without a decision to inform is waste.

---

## Pivot recognition

When learning changes the approach:

1. **Name it.** "This is a pivot, not a tweak."
2. **Capture why.** What did we learn? What assumption was wrong?
3. **Assess impact.** What's affected? What's still valid?
4. **Adapt deliberately.** Update affected work; resequence if needed.
5. **Continue.** Don't relitigate the change. Execute the new approach.

Silent pivots create confusion. Deliberate pivots create clarity.

---

## Natural checkpoints

Pause at every phase boundary and verify the previous phase actually finished before moving on. None of these checkpoints are optional.

- **Before breaking down.** Is the scope actually clear?
- **Before building.** Is this piece actually ready?
- **After building.** Does this actually meet the criteria?
- **Before moving on.** Is this phase actually complete?

These aren't gates with heavy approval workflows — but they're not optional either. Pause, verify, then proceed.

---

## Right-sizing

Match rigor to stakes.

| Project type | Planning | Docs | Tracking |
|---|---|---|---|
| Quick fix | Implicit | None or commit msg | None |
| Small feature | Brief conversation | Maybe a checklist | Informal |
| Significant feature | Explicit scope + criteria | Scope doc, decisions | Work items |
| Multi-phase initiative | Full planning | Scope, specs, decisions | Phases, features, work items |

Over-engineering process is as bad as under-engineering it.

**The thinking is universal.** Same questions at every level:
- What problem are we solving?
- What's the domain?
- What must be true when we're done?
- What's the approach?
- What could go wrong?

A quick fix answers those implicitly. A multi-phase initiative answers them in documents. The thinking doesn't change — what gets made explicit does.

**Start anywhere; adjust as needed.** Realize it's more complex than you thought? Add documentation. Realize it's simpler? Skip the ceremony. Context getting lost? Persist what matters. The thinking you've already done is never wasted.

---

## Anti-patterns

- **Ceremony without thinking.** Following steps without understanding why.
- **Skipping phases.** Jumping to building before scoping is clear.
- **Blending phases.** Trying to scope and build simultaneously.
- **Open-ended research.** Investigation without timebox or a decision to inform.
- **Silent pivots.** Changing approach without acknowledging it.
- **Over-documenting.** Writing things no one will read.
- **Under-documenting.** Losing important context because "it's obvious."
- **Rigid process for small work.** Full ceremony for a one-line bug fix.
- **No process for big work.** Winging a multi-phase initiative.
