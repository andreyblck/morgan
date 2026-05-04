---
name: aftermath
description: Contain incident, recover, postmortem, prevent recurrence.
argument-hint: "[incident]"
---

# /aftermath

Clear the air after the trouble.

---

## Intent

Something went sideways. Maybe production is on fire, maybe you shipped something broken, maybe the process failed. This isn't about finding the root cause — that's `/track`. This is about containing the damage, recovering, and making sure it doesn't happen again.

---

## Load skill

Load the `morgan` skill first. Then read its `incident`, `tracing`, and `pivoting` references.

---

## Start

$ARGUMENTS

If no incident was specified, STOP and use the AskUserQuestion tool to ask: What happened? Is this an active incident, a postmortem, or a retrospective?

---

## Pre-flight

### Determine the phase

| Phase | Signals | Focus |
|---|---|---|
| **Active** | Production down, users impacted, ongoing | Contain, communicate, fix |
| **Post-incident** | Resolved, need to understand | Postmortem, document, action items |
| **Retrospective** | Pattern of issues, process problems | Broader learning, process change |

Different phases need different approaches.

---

## Gather context with sub-agents

Spawn sub-agents to gather information in parallel. During incidents, context preservation matters even more. Don't burn main context on investigation.

**Sub-agent tasks:**
- Build a timeline from git history (specify the affected areas; check commits, deployments, and config changes in the relevant time range).
- Identify affected components and downstream dependencies (name the system or feature that broke; trace its connections).
- Check for related issues or similar past incidents (search commit messages, issue trackers, and error patterns).
- Review test coverage and recent test results for the affected area (point to test directories).

**Brief each sub-agent with:**
- What happened (the symptom, when it started, what's impacted).
- The specific systems, files, and directories to investigate.
- Expected output: timestamped facts (what happened when), affected component list, and any evidence of root cause. Keep it factual. Analysis comes later.

**After collection:**
- Verify timeline claims against actual git history and logs. Sub-agents can misattribute changes or get timestamps wrong.
- Feed verified facts into the appropriate phase below.

---

## Active incident

When things are on fire, focus on containment first.

### 1. Assess severity

| Severity | Impact | Response |
|---|---|---|
| **Critical** | Production down, data loss, security breach | All hands, immediate |
| **High** | Major feature broken, significant user impact | Priority fix |
| **Medium** | Degraded experience, workaround exists | Scheduled fix |
| **Low** | Minor issue, limited impact | Normal queue |

### 2. Contain

Stop the bleeding before fixing the root cause.

- Can we roll back?
- Can we disable the broken feature?
- Can we fail gracefully?
- What's the smallest change that stops the damage?

Don't optimize. Don't refactor. Contain.

### 3. Communicate

Who needs to know?
- Users affected.
- Team members.
- Stakeholders.

What do they need to know?
- What's happening.
- What we're doing.
- When they'll hear more.

Silence is worse than "we're investigating."

### 4. Fix

Once contained, fix properly:
- Use `/track` if root cause isn't clear.
- Minimal fix to resolve — don't scope creep.
- Test before deploying.
- Monitor after deployment.

### 5. Transition to postmortem

Incident resolved. Now learn from it.

---

## Postmortem

After the fire is out, understand what happened.

### 1. Timeline

Build the narrative:
- When did it start?
- When was it detected?
- When was it contained?
- When was it resolved?
- What actions were taken and when?

Facts first, analysis later.

### 2. Root cause

Use `/track` thinking if not already done:
- What was the immediate cause?
- What was the underlying cause?
- What allowed this to happen?

### 3. Five Whys

Keep asking why until you hit the systemic issue:

1. Why did the deployment fail? → Config was wrong.
2. Why was config wrong? → Manual edit, typo.
3. Why manual edit? → No automated config management.
4. Why no automation? → Never prioritized.
5. Why never prioritized? → No incident had forced it.

The fix isn't "be more careful" — it's "automate config management."

### 4. Contributing factors

What else played a role?
- Process gaps.
- Missing tests.
- Documentation gaps.
- Communication failures.
- Tooling limitations.
- Time pressure.

Be honest. Blame the system, not people.

### 5. Action items

What changes prevent recurrence?

**Every action item needs:**
- Specific outcome (not "improve testing" → "add integration test for payment flow").
- Owner.
- Priority (now / soon / later).

No vague actions. No unowned items.

### 6. Document

Capture for future reference:
- Summary (1–2 sentences).
- Impact (who/what affected).
- Timeline.
- Root cause.
- Contributing factors.
- Action items.
- Lessons learned.

This isn't paperwork. It's how the team learns.

### 7. Append to `.camp/lessons.md`

After the postmortem document is saved, append a condensed entry to `.camp/lessons.md` (gitignored, persists across sessions). This is the cross-session memory — future Arthur reads it on `/morgan` invocation and surfaces relevant precedents.

**Format (terse — keep entries short):**

```markdown
## YYYY-MM-DD — [short title]

**Pattern:** [the kind of failure — e.g., "missing input validation on JSON parser"]
**Root cause:** [one sentence]
**Watch for:** [the signal future-Arthur should recognize]
**Action taken:** [the fix or process change]
```

If `.camp/lessons.md` doesn't exist, create it. If it does, prepend the new entry at the top (newest first). Don't replace — accumulate.

The full postmortem still lives wherever the user keeps incident docs. The lessons entry is just the *pattern index* — three to four lines per incident — so future-you doesn't have to re-read every postmortem to recognise a recurrence.

---

## Retrospective

For broader patterns, not single incidents.

### 1. Set the frame

What are we reflecting on?
- A project completion.
- A sprint / cycle.
- A pattern of issues.
- A process that isn't working.

### 2. Gather input

What went well? (Keep doing.)
What didn't? (Stop or change.)
What confused us? (Clarify.)
What should we try? (Experiments.)

Get input from everyone involved.

### 3. Identify patterns

Don't just list items. Look for themes:
- Are multiple issues pointing to the same root cause?
- What keeps coming up?
- What did we say last time that we didn't act on?

### 4. Prioritize actions

Can't fix everything. Pick 1–3 changes:
- What has the highest impact?
- What's actually achievable?
- What will we commit to?

### 5. Commit

Specific, owned, time-bound:
- "We will do X."
- "Owner: Y."
- "By: Z."

Review next retrospective — did we actually do it?

---

## Output

**For active incidents:**
- Severity and impact.
- Containment actions taken.
- Fix deployed.
- Monitoring status.
- Postmortem scheduled.

**For postmortems:**
- Incident summary.
- Timeline.
- Root cause.
- Contributing factors.
- Action items (specific, owned, prioritized).

**For retrospectives:**
- What worked / didn't / confused.
- Patterns identified.
- Committed changes (1–3, owned).

---

## Persist

Postmortems and incident reports must be saved — they're how teams learn. Ask where to save permanently — these belong where the team can find them, not buried in a scratch directory. Fall back to `.camp/aftermath-<slug>.md` if the user doesn't have a permanent location yet. Incidents that aren't documented will be repeated.

---

## Anti-patterns

- **Hero culture.** One person fixes everything, no documentation, knowledge silos.
- **Blame individuals.** "Andrey made a mistake" vs "Our process allowed this mistake."
- **Vague action items.** "Be more careful" doesn't prevent recurrence.
- **No follow-through.** Action items that never happen. Review them.
- **Skipping postmortems.** "We fixed it, move on." You'll fix it again.
- **Postmortem theater.** Going through the motions without honest reflection.
- **Too many actions.** 15 action items means nothing gets done. Pick 1–3.
- **Waiting too long.** Do postmortems while memory is fresh.

---

## Next

Postmortem captured. If action items are concrete fixes — `/case` them so they get sequenced and built, not just listed.
