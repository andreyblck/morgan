# SDLC

Universal concepts for building software. Names vary, tools vary, the thinking doesn't.

Loaded contextually — when the task involves choosing process, recognizing what's missing, or adapting to an existing workflow.

---

## The point

Every methodology — Agile, Waterfall, Shape Up, whatever — is just different answers to the same questions. The questions are universal. How you answer them is up to you.

Arthur knows the questions. The user chooses how to capture the answers.

---

## The concepts

### Scope

What are we building, and why? What's IN, what's OUT, what's success?

**Also called:** PRD, brief, contract, spec, pitch, RFC, proposal, epic description.

**Examples:**
- A markdown file: `docs/scope.md` or `docs/brief.md`.
- A GitHub issue labeled "scope" or "RFC".
- A Notion page or Confluence doc.
- A section in `README.md`.
- A Linear project description.
- A conversation summary in `CLAUDE.md`.

**Minimum viable:** one paragraph that answers — what problem, for whom, what's success.

---

### Requirements

What must it do? Testable commitments that define done.

**Also called:** acceptance criteria, user stories, functional requirements, specs, "it should…"

**Examples:**
- Bullet points in a scope doc.
- Checkboxes on an issue.
- Given/When/Then scenarios.
- "Users can X" statements.
- API contracts.

**Minimum viable:** a list someone else could verify against.

---

### Design

How does it work? Architecture, data structures, key flows.

**Also called:** technical spec, architecture doc, design doc, system design, RFC.

**Examples:**
- `docs/design.md` or `docs/architecture.md`.
- Diagrams (C4, sequence, ERD).
- Code comments explaining why.
- ADRs that capture approach.
- README technical sections.

**Minimum viable:** enough that someone else could implement it without guessing.

---

### Decisions

Why did we choose X over Y? Captured rationale that prevents re-litigation.

**Also called:** ADRs, decision records, decision log, "why we…"

**Examples:**
- `docs/decisions/` folder with numbered files.
- A single `decisions.md` append-only log.
- PR descriptions explaining trade-offs.
- Commit messages with context.
- Comments in code.
- Issue comments.

**Minimum viable:** date, decision, why. Three lines.

**Format options:**
- Full ADR: Status, Context, Decision, Consequences.
- Y-statement: "In context of X, facing Y, we decided Z to achieve A, accepting B."
- Simple log: `YYYY-MM-DD: Chose X because Y`.

---

### Changes

How do we modify agreed scope, requirements, or decisions? Controlled evolution.

**Also called:** change requests, scope changes, amendments, pivots, RFC updates.

**Examples:**
- Change request document or issue.
- PR that modifies scope doc with explanation.
- Issue comment: "Changing X because Y, impacts Z."
- Decision record that supersedes a previous decision.

**Minimum viable:** "Changed X to Y because Z" — somewhere findable. See `pivoting` reference for the full process.

---

### Constraints

What must always be true? What must never happen? Non-negotiable rules.

**Also called:** invariants, security requirements, compliance rules, SLAs, guardrails.

**Examples:**
- "Passwords must be hashed."
- "Response time < 200ms p95."
- "Never store PII in logs."
- "Balance can never go negative."
- Validation rules in code.

**Minimum viable:** explicitly stated somewhere, enforced somehow.

---

### Work

What needs doing? Trackable units of effort with clear done criteria.

**Also called:** stories, tasks, tickets, issues, TODOs, items, cards.

**Examples:**
- GitHub / GitLab issues.
- Linear / JIRA / Asana tickets.
- Markdown checklists.
- Notion task database.
- TODO comments (temporary).

**Hierarchy options:**
- Flat list (small projects).
- Epic → Story (medium).
- Milestone → Epic → Story → Task (large).
- Phase → Feature → Work item (alternative naming).

**Minimum viable:** something you can check off when done.

---

### Plan

What order? What phases? What depends on what?

**Also called:** roadmap, milestones, sprints, phases, timeline, project plan.

**Examples:**
- Milestones in GitHub / Linear.
- Phases in a scope doc.
- Sprint boards.
- Gantt charts (if you must).
- "v1, v2, v3" sections.

**Minimum viable:** what's now vs what's later.

---

### Progress

What's done? What's in flight? What's blocked? What changed?

**Also called:** status, changelog, standup notes, burndown, done column.

**Examples:**
- Issue / PR status.
- `CLAUDE.md` status section.
- Changelog entries.
- Sprint reports.
- "Done" column on a board.
- Git history.

**Minimum viable:** someone can tell where things stand.

---

### Context

What does the next person (or agent) need to continue the work?

**Also called:** handoff, session notes, status update, "current state."

**Examples:**
- `CLAUDE.md` with status + next steps.
- Handoff document.
- Issue comments summarizing state.
- Session logs.
- "Where we left off" notes.

**Minimum viable:** next action is clear.

---

### Research

What unknowns did we investigate? What did we learn?

**Also called:** spikes, prototypes, POCs, experiments, investigations, benchmarks.

**Examples:**
- Spike tickets with findings.
- `docs/research/` or `docs/spikes/`.
- PR with prototype code.
- Issue comment with results.
- Decision that references investigation.

**Key principle:** timeboxed, answers a question, informs a decision.

---

### Incidents

What broke? What did we do? What will prevent recurrence?

**Also called:** incident reports, postmortems, outage notes, bug reports, hotfixes.

**Examples:**
- Incident tickets.
- Postmortem documents.
- `docs/incidents/` folder.
- Linked issues (bug → fix → postmortem).
- Slack threads (captured somewhere permanent).

**Minimum viable:** what happened, what we did, what we learned.

---

### Retrospectives

What worked? What didn't? What will we change?

**Also called:** retros, lessons learned, process improvements, team reflections.

**Examples:**
- Retro documents after milestones.
- Sprint retrospective notes.
- "Lessons learned" section in postmortems.
- Process change tickets.
- Team wiki updates.

**Minimum viable:** one thing to keep, one thing to change.

---

## Implementation patterns

Right-size the rigor. Not every project needs everything.

### Minimal (solo / weekend / spike)

```
CLAUDE.md           # Scope + status + next steps
git commits         # Decisions + progress
```

That's it. README if you're sharing.

### Light (active project / small team)

```
CLAUDE.md           # Context for agents
docs/
├── brief.md        # Scope and requirements
└── decisions.md    # Append-only log
```

Plus GitHub Issues or a checklist for work tracking.

### Standard (team / multi-phase)

```
CLAUDE.md           # Agent bootstrap
docs/
├── prd.md          # Or brief.md, scope.md
├── design.md       # Architecture, data model
├── decisions/      # Individual ADRs
│   ├── 001-database.md
│   └── 002-api-style.md
└── research/       # Spike findings
```

Plus an issue tracker (GitHub, Linear, JIRA) for work.

### Full (enterprise / regulated / large team)

```
docs/
├── requirements/   # Formal, traceable
├── specs/          # Functional + technical
├── decisions/      # ADRs with approval
├── plans/          # Roadmaps, milestones
└── incidents/      # Postmortems, compliance
```

Plus a formal issue tracker, change management, audit trails.

---

## Documentation for agents

AI agents start each session fresh. They need explicit context to continue work. The same SDLC concepts apply, but how you write them matters.

### What agents need

- **Explicit state.** Don't make agents infer. State current status directly.
- **Parseable structure.** Consistent headings, clear sections, no ambiguity.
- **Runnable commands.** Actual commands, not prose descriptions.
- **Recent context.** What happened last session, what's in progress.
- **Clear next action.** What to do now, not just what exists.

### The memory bank concept

Some projects structure docs specifically for agent continuity — a "memory bank" that persists across sessions. This isn't new concepts, just SDLC concepts organized for agents.

| Agent needs | SDLC concept | Captures |
|---|---|---|
| Why are we here? | Scope | Goals, success criteria, boundaries |
| How does it work? | Design | Architecture, data, flows |
| What rules apply? | Constraints + Decisions | Invariants, choices, rationale |
| What's the work? | Work + Plan | Tasks, priorities, dependencies |
| Where are we? | Progress + Context | Status, blockers, next steps |

### Structuring for agent continuity

**`CLAUDE.md` as bootstrap:**
- Orient: what is this project?
- Point: where do other docs live?
- Status: where are we now?
- Next: what to do first?

**Supporting docs provide depth:**
- Scope doc for goals and boundaries.
- Design doc for how things work.
- Decisions log for rationale.
- Work tracking for tasks.

**Update frequency:**
- Scope / Design / Decisions: when they change.
- Work: as tasks complete.
- Progress / Context: every session.

### Agent-friendly formatting

**Do:**

```markdown
## Status
- [x] Authentication complete
- [ ] Authorization in progress
- [ ] API endpoints pending

## Next
Implement role-based access control. See docs/design.md#authorization.

## Commands
npm run dev    # Start development server
npm test       # Run tests
```

**Don't:**

```markdown
We've been working on the authentication system and it's mostly done.
Next we should probably look at authorization stuff. You can run the
usual commands to get started.
```

### Cross-tool compatibility

Different tools use different config files.

| Tool | File | Purpose |
|---|---|---|
| Claude Code | `CLAUDE.md` | Project context |
| Cursor | `.cursorrules` | Project rules |
| Codex / Copilot | `AGENTS.md` | Agent instructions |
| Gemini | `GEMINI.md` | Project context |

The concepts are the same. Adapt format to your tools.

---

## Helping the user choose

When setting up a workflow, ask:

1. **What's the scale?** Solo, small team, large team, enterprise?
2. **What tools exist?** Already using Linear? GitHub? Notion? Nothing?
3. **What's the risk?** Hobby project? Production system? Regulated industry?
4. **Who needs to understand?** Just you? Team? Future maintainers? Auditors?

Then recommend the lightest approach that covers their needs.

**Defaults:**
- Solo / small: `CLAUDE.md` + `docs/brief.md` + GitHub Issues.
- Team: add `decisions/` and design docs.
- Enterprise: add formal requirements, specs, change control.

**Principle:** start light, add ceremony when pain indicates need.

---

## Adapting to what exists

When joining a project:

1. **Check what's there** — README, `docs/`, issues, `CLAUDE.md`.
2. **Understand the current system** — how does this team track work? Decisions?
3. **Work within it** — don't impose new structure without agreement.
4. **Fill gaps gently** — missing scope doc? Offer to create one. Missing decisions? Start logging.

Don't assume nothing exists. Don't assume what exists is complete.

---

## Tool mapping

Same concepts, different tools.

| Concept | Files | GitHub | Linear | JIRA | Notion |
|---|---|---|---|---|---|
| Scope | `brief.md` | Issue / Discussion | Project desc | Epic | Page |
| Requirements | In scope doc | Issue body | Issue desc | Story | Database |
| Design | `design.md` | Wiki / Discussion | Doc link | Confluence | Page |
| Decisions | `decisions/` | PR desc, ADRs | Doc link | Confluence | Database |
| Changes | In `decisions/` | Issue / PR | Issue | CR ticket | Page / Database |
| Work | Checklist | Issues | Issues | Stories | Tasks |
| Plan | In brief | Milestones | Cycles | Sprints | Timeline |
| Progress | `CLAUDE.md` | Issue status | Status | Board | Status |
| Context | `CLAUDE.md` | Pinned issue | Doc link | Confluence | Page |
| Research | `research/` | Issue | Issue | Spike | Page |
| Incidents | `incidents/` | Issue | Issue | Incident | Page |

The tool doesn't matter. The concepts do.

---

## Arthur's role

Do these. Every project. Don't skip any.

1. **Recognize what exists** — check for docs, issues, existing patterns before creating anything.
2. **Ask about workflow** — "How do you track work? Where do decisions live?" Don't assume.
3. **Suggest appropriate ceremony** — match recommendations to project scale.
4. **Create artifacts when needed** — but ask first; don't impose structure.
5. **Maintain what's there** — update `CLAUDE.md`, log decisions, track progress. Stale artifacts mislead.
6. **Adapt** — every project is different. No single right answer.

---

## Anti-patterns

- **Assuming nothing exists.** Check before creating.
- **Imposing structure.** Work within existing systems unless asked to change them.
- **Over-engineering for small projects.** A weekend hack doesn't need ADRs.
- **Under-engineering for large projects.** Enterprise systems need rigor.
- **Tool worship.** The tool doesn't matter. The concepts do.
- **Ceremony without thinking.** Documents nobody reads are waste.
- **No ceremony when needed.** "It's all in my head" doesn't scale.
- **Copying someone else's process.** What works for one team might not work for yours.
- **Silent scope changes.** Changing what you're building without acknowledging it.
- **Relitigating settled decisions.** Reopening closed discussions without new information.
- **Change theater.** Heavy CR process for trivial modifications.
