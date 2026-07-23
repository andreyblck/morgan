---
name: track
description: Root-cause analysis — trace from symptom to source.
argument-hint: "[issue]"
---

# /track

Track the trail to its source.

---

## Intent

Something's broken. You're finding out why. Not guessing. Not patching symptoms. Tracing to the root cause and fixing it properly.

---

## Load skill

Load the `morgan` skill first. Then read its `tracing`, `verification`, and `incident` references.

---

## Start

$ARGUMENTS

If no issue was specified, STOP and use the AskUserQuestion tool to ask: What's broken? Describe the symptom, when it started, and what you've already tried.

---

## The discipline

### Can't fix what you can't reproduce

The reproduction is a command, not a claim. Get the steps, follow them exactly, and turn them into something you can run on demand and run again — see step 2 below. Note the variations you find along the way; they narrow the cause faster than reading does.

A bug you've only read about is a bug you're guessing at. Period.

### Root cause over symptoms

A fix without understanding is a band-aid. It will fail again, differently, at a worse time.

Don't just find WHERE it fails. Understand WHY.

---

## Diagnosis workflow

Open a ledger before you dig, and keep it live. The instant this is more than a one-read fix, start an in-flight working log at `.camp/track-<slug>.md` and write to it *as you go* — every attempt and what it produced, and each killed theory under **Ruled out** with the evidence that killed it, recorded the moment you rule it out, not from memory later. That ledger survives a dropped session and is what the next agent reads to keep off your dead ends. Format and sections: see the in-flight working log in the `handing-off` reference.

### 1. Gather information

If the symptom, timeline, and scope are already clear, proceed. Otherwise:

STOP and use the AskUserQuestion tool to ask: What additional context is needed? Specifically — what is the symptom? When did it start? What changed recently? Who/what is affected? How often does it occur?

### 2. Build the reproduction command

Before you read code to build a theory, make the failure something you can run. Not "I followed the steps" — a named command you have actually executed, whose output you can paste, that asserts the symptom the user reported.

Four conditions on the command:

- It drives the real code path and asserts *the user's* symptom — not a nearby failure that happens to be red.
- Same verdict every run.
- Seconds, not minutes. You're going to run it a hundred times.
- You can run it unattended.

Reach for the cheapest rung that gives you that, and climb only as far as you need: a failing test → a `curl` or CLI invocation → a command plus a fixture, diffed against expected output → a headless browser run → a captured real request replayed → a purpose-built harness.

Same bar for every bug; the effort scales. A crash the stack trace explains on sight is reproduced by the test you were going to write anyway — one command, thirty seconds, move on. The harder the failure is to pin, the more the rungs above earn their keep.

**If it only fails sometimes.** You're not chasing a clean reproduction — you're chasing a higher failure rate. Loop it a hundred times, run copies in parallel, load the machine, widen the timing window with a sleep in the suspect path. One failure in two is a bug you can work; one in a hundred isn't. Record the rate you reached: a measured rate is what lets you run the gate's toggle later, by comparing the rate with the suspected cause present and removed. A rate is not itself a toggle — it's what makes the toggle readable.

**If a person has to perform a step** you can't reach, give them one script with fixed prompts that reads their answers back to you, so every round is comparable. That's the bottom rung — take it only when the automated options are closed.

**If you can't build one at all**, say so plainly and stop. List what you tried, then ask for one of three things: access to somewhere it does reproduce, a captured artefact (log dump, network capture, recording with timestamps), or the go-ahead to add temporary instrumentation where it happens.

### 3. Cut it down

Shrink the failing case before you theorise about it — cut one thing at a time and re-run, until pulling any remaining piece turns it green. What's left is the smallest space the cause can be hiding in, and every element still standing is a suspect worth your time. Keep it; it's the raw material for the regression test, though where that test lives is settled under Fix verification below.

### 4. Investigate with sub-agents

Spawn at least three sub-agents in parallel — one on the code path, one on git history, one on similar patterns. Compression is laziness; if four signals matter, four agents run. Don't waste main context on exploration an agent can do. When the trail is cold or the obvious answer won't hold, send **Hosea** — he's built to not quit, and he reports a confidence verdict you can hold the diagnosis to.

**Sub-agent tasks:**
- Trace the code path from entry point to failure (name the entry point, the expected flow, and where it breaks).
- Check git history for recent changes to affected areas (specify the files, directories, and time range).
- Search for similar patterns or related issues in the codebase (describe the failure pattern to match against).
- Review test coverage for the affected code (point to the test directories and specify what should be covered).
- **If a Sentry MCP server is connected** (tools matching `mcp__sentry__*`), query for recent issues matching the symptom or affecting the same area. Surface error frequency, first/last seen, environment, similar error fingerprints. Ground the diagnosis in production telemetry instead of guessing. If no Sentry MCP, note its absence in the report and proceed with code/git evidence only.

**Brief each sub-agent with:**
- The symptom description and reproduction steps.
- The specific files, functions, or modules under investigation.
- What to report: file paths, line numbers, git commit hashes, and a clear description of what they found and why it matters. For git history: who changed what, when, and what the commit message says.

**After collection:**
- Verify findings against the actual code and git history. Sub-agents can misidentify the failure point or attribute changes to the wrong commits.
- Synthesize into a picture of what happened: the code path, what changed, and where the investigation should focus next.

### 5. Line up the causes

Name three to five candidates **before you test any of them**. The first explanation you think of gets tested first, survives because you went looking for what confirms it, and quietly becomes the answer. Generating the field first is the cheap defence against that.

Write each one as a prediction you could be proven wrong about: *if this is the cause, then changing Y makes the symptom disappear.* A candidate that won't take that shape isn't a theory yet. Sharpen it until it makes a claim, or drop it.

Rank them by what the evidence so far actually supports, then **put the list in front of the user before you start testing**. They know things the codebase doesn't — that number three shipped yesterday, that number one was ruled out last month. One reply often kills half the field. Don't block on them if they're away; note that you didn't wait and carry on.

This is upstream of the certainty gate, not a substitute for it. Lining up candidates is how you avoid anchoring; killing them with evidence is what the gate below demands.

### 6. The 5 Whys

Don't stop at the first answer:
1. "Why did this fail?" → [answer]
2. "Why did that happen?" → [answer]
3. "Why did that happen?" → [answer]
4. "And why?" → [answer]
5. "What's the underlying cause?" → [root cause]

Most people stop at Why #1. That's why bugs come back.

Five is a rhythm, not a finish line. You're not done at Why #5 — you're done when the cause clears the certainty gate below. If three whys reach a systemic cause you can prove, stop there. If five don't, keep asking.

### 7. Check recent changes

- Is this a regression?
- What changed recently?
- When did it last work?

`git log` and `git bisect` are your friends.

### 8. Look for patterns

- Same module?
- Same type of error?
- Same time period?
- Same code path?

Patterns signal systemic issues, not isolated bugs.

### 9. Clear the certainty gate

A named cause is not a proven cause. This is the gate the diagnosis has to clear before you touch a fix — and the line most people cross too early. All four must hold:

1. **It reproduces.** You can turn the symptom on and off by manipulating the cause. Toggle it, watch the symptom follow — run the experiment, don't imagine it. A toggle you reasoned about but never executed isn't a reproduction. If you can't demonstrate the causal link, you've got a theory, not a root cause.
2. **It accounts for everything.** The cause explains every symptom and the whole timeline — not just the convenient ones. One symptom it doesn't explain means you're not done.
3. **The competitors are dead.** You named at least one alternative explanation and ruled it out with evidence. A single surviving theory you never challenged is not a conclusion.
4. **Confidence is "Confirmed."** State it on Hosea's ladder — Confirmed / Strong theory / Working theory / Inconclusive. Only *Confirmed* clears the gate: the evidence directly proves the cause. Anything less, you keep digging or send another investigator. Say the verdict out loud. Never quietly downgrade certainty to call it done.

The bar is the same for every bug; the effort isn't. A cause the code proves on sight clears all four as fast as you can name it — one read reproduces it, one symptom is the whole story, Confirmed is immediate. The harder the cause hides, the more these conditions earn their keep — and the more a small-looking fix tempts you to skip them. Don't. A one-line patch on an unproven cause is still a guess.

If the gate won't clear, the diagnosis isn't finished — no matter how plausible the answer feels. Go back: another why, another agent, another angle. Don't carry an unproven cause into a fix — that's how the same bug returns later, looking like a new one.

---

## After diagnosis, before the fix

Root cause is named *and the certainty gate is clear*. The next move depends on the size of the fix:

- **Trivial fix.** One file, one site, no public contract change. Stay here. Write the failing test, patch it, commit. The rest of this command applies to you.
- **Non-trivial fix.** Touches multiple sites. Changes a public contract. Has scope worth arguing about. Don't inline-plan it here. Step out: `/scope` to lock the fix's scope and success criteria, then `/case` to decompose, then `/pull` to build. Come back to "Fix verification" below when the work lands.

Naming a cause is one phase. Designing the fix is another. Don't blend them.

---

## Triage (if multiple issues)

Classify quickly. Don't investigate deeply during triage.

**Severity** (impact):
- **Critical** — system unusable, data loss, security.
- **High** — major feature broken, no workaround.
- **Medium** — feature impaired, workaround exists.
- **Low** — minor, cosmetic, edge case.

**Priority** (when to fix):
- **Critical** — drop everything.
- **High** — this sprint.
- **Medium** — schedule upcoming.
- **Low** — backlog.

### Triage outcomes

- **Clear and fixable** → fix it.
- **Needs investigation** → create spike, timebox it.
- **Cannot reproduce** → try for a failure rate before you call it that; if the loop still won't build, name what you tried and ask for access, a capture, or instrumentation.
- **Duplicate** → link and close.
- **Not a bug** → close with explanation.
- **Feature request** → separate work item.

---

## Fix verification

After fixing:
1. Failing test passes.
2. The reproduction command from step 2 no longer fails — run it, don't assume it.
3. Full test suite green.
4. Regression tests added for edge cases.
5. No unintended side effects.

The reduced case from step 3 is the content of the regression test, but not automatically its shape. Put the test at a seam that runs the bug the way it actually happened. If the only seam available is shallower than the failure — a single-caller test for something that needed two callers, a unit test that can't build the chain that broke — it's green today and it'll be green through the next occurrence.

If no seam runs the real path, that's a finding about the code, not a gap in your effort. Say it plainly, fix the bug anyway, and raise the structural problem after the fix lands — send Lenny at it, or carry it to `/case`. What you don't do is settle for a test that would have passed either way.

If you can't prove it's fixed, it's not fixed.

---

## Document the fix

- What was the root cause?
- What fix was applied?
- What regression tests were added?
- What edge cases were covered?

Future you (or someone else) will thank you.

---

## Next

If this was a significant incident or part of a pattern, use `/aftermath` to:
- Run a postmortem (what happened, why, how to prevent).
- Identify systemic issues.
- Create action items that actually get done.

Discovery is `/track`. Recovery and learning is `/aftermath`.

---

## Persist

If you kept a live ledger (you should have — see the Diagnosis workflow), the trace already lives at `.camp/track-<symptom-slug>.md`. Close it out: fold in the confirmed root cause, the fix rationale, and the regression context, and set **Confidence** to where it actually landed. The ruled-out theories stay — they're the part that saves the next debugging session, not noise to clear. If the bug was trivial enough that you skipped the ledger, write the trace now; root cause and regression context are worth keeping for future debugging and postmortems.

---

## Key questions

**When diagnosing**
- Can I reproduce this reliably?
- What's the exact failure point?
- WHY does it fail there?
- Is this a regression?
- Is this part of a pattern?

**When fixing**
- Do I understand the root cause?
- Am I fixing the cause or the symptom?
- What tests prevent recurrence?
- What edge cases might have the same issue?

---

## Anti-patterns

- **Fixing without reproducing.** You're guessing. So is reading code to build a theory before any command has failed — the reproduction comes first, then the thinking.
- **Hypothesising against the whole scenario.** Every element you didn't cut is a suspect you'll spend time on. Shrink the case, then think.
- **Fixing symptoms.** The null check that papers over the real issue.
- **No regression tests.** The bug will return.
- **Stopping at the first plausible cause.** A cause you can name but can't prove is a suspect, not a verdict. Assume your first theory is wrong until the evidence forces you to keep it. Clear the certainty gate before you fix anything.
- **Confusing a timebox with a conclusion.** Bounding effort is fine — when a round of investigation comes up empty, escalate to the user. But escalation means "still a working theory, here's what I checked and what's next" — not a band-aid built on a guess. Never trade certainty for the clock.
- **Severity inflation.** Not everything is critical.
- **Ignoring patterns.** Three similar bugs = systemic problem.
- **Investigating in main context.** Use sub-agents for research. Don't waste tokens.

---

Find the source. Fix it right. Make sure it stays fixed.
