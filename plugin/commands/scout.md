---
name: scout
description: Bounded research to answer a specific question before committing.
argument-hint: "[question]"
---

# /scout

Scout ahead before you ride in.

---

## Intent

You're investigating an unknown before committing to an approach. Not open-ended exploration. Bounded research that answers a specific question and ends with a recommendation. Research without a decision to inform is waste.

---

## Load skill

Load the `morgan` skill first. Then read its `breakdown` and `scoping` references.

---

## Start

$ARGUMENTS

If no question was specified, STOP and use the AskUserQuestion tool to ask: What specific question do we need to answer? What decision does this inform?

---

## Pre-flight

Before researching:

### 1. Validate the question

- [ ] Question is specific and answerable (not "what's the best way to do X").
- [ ] Answer doesn't already exist (checked docs, codebase, previous decisions).
- [ ] A real decision depends on this answer.

If the question is vague, sharpen it first. "Should we use Redis?" becomes "Can Redis handle 10K concurrent connections with our access patterns?"

### 2. Identify the decision

What choice does this inform? Be explicit:
- "If X, we'll do A. If Y, we'll do B."
- "This determines whether we build or buy."
- "This unblocks the prep for feature Z."

No pending decision = no scout. You're just exploring.

### 3. Set investigation scope

Not time — scope. What bounds the research?

| Scope | When to use | Bounds |
|---|---|---|
| **Quick** | Surface-level answer needed | First credible source, 2–3 data points |
| **Moderate** | Comparing options | 2–3 alternatives, pros/cons for each |
| **Deep** | High-stakes or complex decision | Thorough investigation, multiple sources, edge cases |

State the scope explicitly before starting.

---

## The process

### 1. Research with sub-agents

Spawn sub-agents to explore in parallel. Don't waste context on exploration.

**Sub-agent tasks depend on scope:**

**Quick:**
- Find authoritative answer to the specific question (name the sources to check).
- Verify with one additional source.

**Moderate:**
- Survey 2–3 viable options (specify the criteria for viability).
- Identify key trade-offs for each (name the dimensions that matter: performance, complexity, maintenance, cost).
- Check for existing patterns in codebase (point to directories and file types).

**Deep:**
- Comprehensive option survey (specify the search space and evaluation criteria).
- Technical deep-dive on leading candidates (name them if known, or specify how to identify them).
- Edge cases and failure modes.
- Real-world usage and gotchas (specify communities or documentation sites to check).
- Compatibility with existing stack (list the technologies and constraints).

**Brief each sub-agent with:**
- The specific question being answered and the decision it informs.
- Where to look (documentation sites, codebase directories, package registries, communities).
- Expected output: findings with sources and confidence levels, not just summaries. For codebase research: file paths and code references.

### 2. Synthesize findings

Collect sub-agent results. Before synthesizing:
- Verify key claims. Sub-agents can misread documentation, cite outdated information, or conflate similar technologies.
- Check that sources are authoritative and current.

Organize by:
- What we learned.
- What surprised us.
- What remains uncertain.

Don't just dump raw findings. Synthesize into insight.

### 3. Make a recommendation

Not a list of options. A recommendation.

**Structure:**
- **Recommendation:** "Use X" or "Go with approach A."
- **Confidence:** High / Medium / Low.
- **Key evidence:** 2–3 points that support the call.
- **Trade-offs:** what you're giving up.
- **Risks:** what could go wrong.

If confidence is low after scoped investigation:
- State what would increase confidence.
- Make a best-guess call anyway, clearly labeled.
- Or: "I can't recommend — here's what I found, you decide."

### 4. Checkpoint

Present findings and recommendation to user.

**User decides:**
- **Enough** — accept recommendation, proceed.
- **Dig deeper** — expand scope, continue research.
- **Different direction** — new question emerged, pivot.

Don't disappear into more research without checking in.

---

## Output

When complete, you should have:

**The question:** what we investigated (specific).

**The decision:** what choice this informs.

**Scope:** Quick / Moderate / Deep.

**Findings:**
- Key insights (bulleted).
- Surprises or unexpected discoveries.
- Remaining uncertainties.

**Recommendation:**
- The call (specific).
- Confidence level.
- Supporting evidence.
- Trade-offs accepted.
- Risks to watch.

**Next:** what happens now that we have an answer.

---

## When to scout

**Before `/scope`:**
- "What solutions exist in this space?"
- "Is this problem already solved?"

**Before `/case`:**
- "Can this library handle our requirements?"
- "Which architecture pattern fits?"

**During `/case`:**
- "How should we approach this component?"
- "What's the complexity of integrating with X?"

**During `/pull`:**
- "This isn't working as expected — why?"
- "Is there a better pattern for this?"

**Key signal:** you can't move forward confidently without answering something first.

---

## Persist

Scout findings exist only in conversation until saved. Save to `.camp/scout-<topic>.md` if the investigation produced significant insights — recommendation, evidence, trade-offs. They inform decisions that need rationale later.

---

## Anti-patterns

- **Vague questions.** "What's the best database?" vs "Can Postgres handle 1M rows with our query patterns?"
- **No decision pending.** Research for curiosity is exploration, not a scout. Know what choice this informs.
- **Unbounded scope.** "Research everything about auth" vs "Compare JWT and session-based auth for our use case."
- **Options without recommendation.** "Here are 5 options" helps no one. Make a call.
- **Disappearing into research.** Checkpoint with user. Don't burn 20 turns without reporting back.
- **Researching the already-known.** Check existing docs, decisions, and codebase first.
- **Scope creep.** New questions emerge. Note them, but finish the current scout first.

---

## Next

Research wraps. Carry the findings back: `/scope` if you were defining a new formula, `/case` if you were unblocking a work item. Don't let the report sit in chat — it gets stale fast.
