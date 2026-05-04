# Foundations

The thinking everything else stands on.

---

## Why this matters

Before scope, before success criteria, before decomposition — understand the domain. Most bugs aren't code bugs. They're understanding bugs. The person who wrote the code didn't grasp the territory they were building in.

Experienced engineers do this without thinking about it. They ask about entities, relationships, lifecycle, and rules before writing a line. They build the mental model first. This reference makes that habit explicit, so it scales when the work gets bigger than one head can hold.

The questions are the same at every scale. The artifacts grow with the stakes.

---

## Three lenses

Every problem has to be looked at from three angles. They aren't sequential phases — they're three viewpoints on the same thing. Skip one and you'll ship something that compiles, runs, and is wrong from a different direction than the one you were watching.

```
Domain  →  Functional  →  Technical
   ↑                          ↓
   ←──────────────────────────
```

- **Domain** shapes what's possible functionally.
- **Functional** requirements drive technical decisions.
- **Technical** constraints sometimes reshape domain understanding.

Iterate between them. Understanding deepens as you move.

---

## Lens 1 — Domain

Understand the problem space itself, in its own language.

### The questions

**Entities — what are the things?**
- What nouns appear when someone describes the problem?
- Which are core, which are supporting?
- What uniquely identifies each?

**Relationships — how do they connect?**
- Which entities reference which?
- One-to-one, one-to-many, many-to-many?
- Required or optional?

**Lifecycle — what states can each be in?**
- What's the journey from creation to retirement?
- What triggers transitions?
- Can states go backward, or only forward?

**Invariants — what must always or never be true?**
- What constraints protect the entities from corruption?
- What business rules are non-negotiable?
- What must remain true no matter who's editing what?

### How it scales

| Complexity | Artifact |
|---|---|
| Simple | Mental model — hold it in your head |
| Moderate | Sketch or bullets — entities and key relationships |
| Complex | Domain model doc — entities, relationships, lifecycle diagrams |
| Enterprise | Formal ontology — complete with validation rules |

### When to go deeper

- Multiple entities with complex relationships.
- State machines with many transitions.
- Business rules that interact or conflict.
- Multiple teams that need a shared mental model.
- You keep stumbling on edge cases that surprise you.

### Anti-patterns

- **Skipping to schema.** Designing tables before understanding the domain. The schema is downstream of the model — never substitute.
- **Entity soup.** Everything's a "thing" with no boundaries. If you can't name it precisely, you don't understand it.
- **Implicit relationships.** "Obviously X relates to Y" — make it explicit, every time. Two readers won't infer the same thing.
- **Ignoring lifecycle.** Treating entities as static when in fact they have states and transitions. Lifecycle bugs hide here.

---

## Lens 2 — Functional

Understand what users can do and what happens when they do.

### The questions

**Capabilities — what can users do?**
- What actions are available to whom?
- What preconditions must be true before each?

**Flows — what's the sequence?**
- What's the happy path?
- What steps are required vs optional?
- Where do flows branch?

**Edge cases — what happens when things go wrong?**
- Invalid input?
- A step that fails partway through?
- An external dependency unavailable?
- A user doing something genuinely unexpected?

**Boundaries — where does this system end?**
- What's handled here vs elsewhere?
- Manual vs automated?
- Synchronous vs asynchronous?

### How it scales

| Complexity | Artifact |
|---|---|
| Simple | Mental walkthrough — trace the happy path in your head |
| Moderate | User flows — bullets or simple diagrams |
| Complex | Flow documentation — every path, including error paths |
| Enterprise | Functional spec — comprehensive with formal edge-case enumeration |

### When to go deeper

- Multiple user roles with different permissions.
- Flows that branch significantly.
- Error handling that visibly affects user experience.
- Integrations with external systems whose behavior you don't control.
- Compliance or audit requirements that demand traceability.

### Anti-patterns

- **Happy path only.** Designing for success and ignoring failure. Real systems fail constantly.
- **God user.** Assuming a single type of user. Different roles have different needs and constraints.
- **Infinite scope.** "Users can do anything." No they can't. Define the bounds.
- **UI-first thinking.** Designing screens before understanding flows. Flows dictate UI, not the other way round.

---

## Lens 3 — Technical

Understand how the system actually works under the hood.

### The questions

**Data structure — how is information organized?**
- What's the schema?
- What's normalized vs denormalized?
- What needs to be indexed?
- What's the source of truth?

**Architecture — how do components interact?**
- What are the major components?
- How do they communicate?
- Synchronous vs asynchronous?
- Where are the failure points?

**Interfaces — what are the boundaries?**
- What APIs exist (internal and external)?
- What contracts must hold?
- What's the versioning strategy?
- What's public vs private?

**Operations — how does it run in the real world?**
- How is it deployed?
- How is it monitored?
- How does it scale?
- How is it debugged when it breaks?

### How it scales

| Complexity | Artifact |
|---|---|
| Simple | Mental model — architecture in your head |
| Moderate | Architecture sketch — components and connections |
| Complex | Technical design doc — with rationale for each major decision |
| Enterprise | Formal spec — ADRs, detailed contracts, dependency tracking |

### When to go deeper

- Multiple services or components.
- Hard performance requirements.
- Real security considerations.
- Team boundaries (who owns what).
- Long-term maintenance concerns.

### Anti-patterns

- **Premature optimization.** Designing for scale before the domain is understood. Optimize when measurement demands it.
- **Architecture astronautics.** Complex architecture for simple problems. Match complexity to actual need.
- **Implicit contracts.** Components "just know" how to talk to each other. Make interfaces explicit.
- **Ops afterthought.** Designing without considering how it runs in production. Operability is a feature, not a chore at the end.

---

## Apply at every phase

The three lenses don't live in one phase — they thread through the whole cycle.

**During `/scope` (formula).** All three lenses inform scope.
- Domain thinking validates the problem definition.
- Functional thinking draws scope boundaries.
- Technical thinking surfaces constraints.

**During `/case` (decomposition).** Let the model drive the breakdown.
- The domain model shapes the work breakdown.
- Functional flows become features.
- Technical architecture reveals dependencies that drive sequencing.

**During `/pull` (build).** Build from understanding, not from guesswork.
- Domain understanding prevents misimplementation.
- Functional flows guide test cases.
- Technical design guides code structure.

**During `/clean` (verification).** Verify against all three.
- Did the implementation respect domain invariants?
- Did the functional flows actually work end to end?
- Did the technical structure match what was committed to?

---

## Quality checks

**Domain**
- [ ] Core entities identified and named.
- [ ] Relationships explicit (not assumed).
- [ ] Lifecycle states documented.
- [ ] Invariants stated.

**Functional**
- [ ] Capabilities defined for each user type.
- [ ] Happy-path flows documented.
- [ ] Error cases considered.
- [ ] Boundaries explicit.

**Technical**
- [ ] Data structure supports the domain model.
- [ ] Architecture matches functional needs.
- [ ] Interfaces defined.
- [ ] Operational concerns addressed.

---

## The principle

You can't build what you don't understand. Foundations thinking is how you understand.

The ceremony scales with the project. The thinking doesn't. A weekend project deserves ten minutes of foundations thinking. An enterprise system deserves weeks of it. Both deserve some.

Skip this and you pay later — in bugs, in rework, in the meeting where someone says "wait, we never thought about that."
