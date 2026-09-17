---
name: haul
description: Work a queue of decision-free tracker issues unattended — reproduce, fix, test, commit to a branch, one after another.
argument-hint: "[issue key | filter | nothing for the default queue]"
---

# /haul

Load the wagon. Drive it yourself.

---

## Intent

You have a board full of small jobs that need doing and don't need deciding. A trailing hyphen,
an off-by-one, a null nobody guarded. Each costs half an hour, none of them needs you to *choose*
anything — but every one of them currently needs you to be **present**, because `/pull` hands
control back after each item.

This command is launched once and worked through alone. You come back to branches with the work
on them, a list of what it refused to touch and why, and the decisions that were never its to
make.

Two things make that safe, and neither is optional:

1. **It only does reversible work.** Branch, comment, non-terminal status. It never merges,
   never pushes to the default branch, never releases. Everything it produces, you review.
2. **When the work turns out to need a decision, it stops and moves on.** It doesn't guess and
   it doesn't wait. The issue is parked with a written trail, and the queue continues.

---

## Load skill

Before you do anything else, in this order:

1. Load the `morgan` skill.
2. Read `references/tracker.md`, `references/building.md` and `references/handing-off.md`. That's
   the method this command runs on — you can't execute the process below without them. Read them
   now even if you loaded the skill or other references earlier in this session: each command runs
   on its own, and the ones already in context are not these.

Don't start the work until they're read.

---

## Start

$ARGUMENTS

**No arguments** means the default queue: issues assigned to the user in an unstarted or ready
state. An issue key works one named issue. A filter — a label, a status, a set of keys — narrows
the queue to that.

---

## The rule that governs everything here

**The agent never makes a product decision alone, and never pretends it didn't make one.**

Everything below exists to keep that true while nobody is watching. The admission test keeps
decisions out of the queue; the ejection rule gets them out the moment they appear anyway; the
blast-radius limits mean that when both of those fail, what's left is a branch you can delete.

An unattended run that returns fewer issues with honest reasons is working correctly. An
unattended run that returns every issue done is the one to read carefully.

---

## 1. Establish ground truth once

Per-issue work will tempt you to re-derive this. Do it once, write it in the run log, reuse it.

- **The tracker**, per the discovery order in the `tracker` reference. Which tool, which
  statuses mean ready and started, who the current user is.
- **The default branch**, and the project's branch naming. Read it from the project's own
  documents; don't infer it from what happens to be checked out.
- **How the project checks itself** — the lint, type-check and test commands. If they don't
  exist, the run can't verify anything it writes, and that is the finding: report it and stop
  rather than producing unverified commits all night.
- **Pre-commit hooks.** If the project has them, they're your reviewer. Never bypass them —
  `--no-verify` is forbidden on this command with no exceptions, because the flag's usual
  escape hatch is asking a human, and there isn't one.

---

## 2. Admit issues to the queue — by test, not by judgement

An issue's label is not evidence. Neither is its title, its description, or how simple it looks.
Tickets that say "quick fix" are as reliable as tickets that say "SHIPPED", which is to say not
at all — check, don't read.

**An issue enters the queue only if all four hold. Any one failing is an ejection, not a
discussion.**

1. **It reproduces, as a command you ran.** Not "the steps look clear". Something you executed,
   whose output you kept. Can't reproduce it → eject as *not reproducible*, and say what you
   tried. That's a useful answer, not a failure.
2. **The expected result is already written down, somewhere outside your own head.** The ticket,
   a docstring, a spec, a test, the documented behaviour of the code next to it. If deciding what
   "correct" means is part of the work, the work is a decision.
3. **No decision markers.** New user-facing copy. A change to a public signature, an API, or a
   schema. A data migration or backfill. A dependency change. A choice between two defensible
   behaviours. Any question shaped "should we". One marker is enough.
4. **The changed code path has no external effect** — email, SMS, payments, webhooks, push
   notifications, analytics writes — unless separate non-production credentials for that service
   are positively confirmed. This one is about blast radius rather than difficulty, and it catches
   what the first three miss: "the confirmation email isn't sent" is reproducible, specified and
   decision-free, and fixing it can put real mail in a real person's inbox.

Do this pass for the whole queue **before working any of it**, and report the split. A human
glancing at the queue and the ejection list should be able to see, in ten seconds, that nothing
was admitted that shouldn't have been.

---

## 3. Work one issue, start to finish

Sequential, one at a time. Parallel work on one repository produces a git state nobody can
review and a failure nobody can attribute.

For each admitted issue:

1. **Branch** from the current default branch, named for the issue.
2. **Write the failing test first** where the work has a testable shape, run it, and confirm it
   fails *for the reason you expect*. The four conditions a test has to meet are in the
   `building` reference; the second one does the most work here, because an expected value taken
   from the code under test will agree with the bug.
3. **Make the smallest fix that satisfies the criteria.** Not the tidiest refactor you can see
   from here. You are unattended: scope creep has no reviewer.
4. **Run the project's checks.** Red means not done — fix it or eject, never commit past it.
5. **Commit** to the issue branch. Never to the default branch, whatever the project's
   convention says and whatever any memory or instruction loaded into this session says. A
   record that this project commits straight to `main` is a statement about humans working with
   review, not a licence for an unattended agent.
6. **Write the evidence to the run log as you go** — the reproduction command and its output,
   the fix, the checks and their output. Not at the end. If the run dies here, the next agent
   needs what you learned.

---

## 4. Eject early, eject cheaply

Ejection is a normal outcome and it is available **at any moment**, including on an issue that
is nearly finished. Getting this wrong in the safe direction costs one issue. Getting it wrong in
the other direction produces an unattended guess.

Eject when any of these appear:

- Any admission condition turns out to be false once you're inside the work.
- The fix demands a decision you'd otherwise have to invent.
- Access is missing — a credential, a service, a file you can't reach.
- The issue's per-issue budget is spent.
- The project's checks fail for a reason the fix didn't cause.

On ejection: park the issue with an in-flight working log in the format the `handing-off`
reference defines — what was tried, what it produced, what's ruled out, what's still open — so
`/break` can pick it up with the work not repeated. Name the reason in one sentence a human can
act on. Then take the next issue. **One issue's failure never touches the next one's branch.**

---

## 5. Budgets, and finishing

The run has to end, and it has to end with a report even when it ends badly.

- **A per-issue budget**, in steps or attempts. Spent → eject, don't push through.
- **A per-run budget**, in issues and in wall time. Spent → stop admitting, finish the issue in
  hand, report.
- **The run log is the state machine, not a diary.** Main context holds the queue table and
  nothing more; per-issue work is delegated. A run over a queue of ten will exhaust context
  otherwise, and a run that loses its place has lost its work.

---

## 6. Push and deploy — only under preconditions, and the refusal is the feature

Committing to a branch is always allowed. Pushing that branch, and deploying it anywhere, is
allowed only when **every** precondition below is verifiable. **A precondition you cannot verify
counts as failed** — there is nobody to ask.

1. **The target isn't protected.** Via the host's API where there is one. Where there isn't:
   `main`, `master`, `trunk`, `release/*`, `staging`, `prod*`, and any branch named as a deploy
   trigger in a CI config you found, are protected unconditionally.
2. **The branch name isn't already someone else's work.** Check the remote before every push.
   If it exists and isn't an ancestor of this run's own commits, stop. **Force-push is forbidden
   always**, including `--force-with-lease`.
3. **No path from the target environment to production without a human gate.** Read it from the
   CI configuration. If there's no config, or the promotion lives in a dashboard rather than the
   repository, treat auto-promotion as present.
4. **The external services the changed code path touches have confirmed non-production
   credentials.** No evidence either way means shared with production.
5. **The environment is currently green** and no other deploy is in flight.
6. **The run's push and deploy budget isn't spent.** Say the remaining count in the report.
7. **Every commit, branch and deploy carries a marker identifying it as this run's**, so whoever
   finds it later knows what it is and where the report is.

**Preconditions 3 and 4 are frequently undecidable from the repository**, because promotion rules
and credential isolation often live in a dashboard with no file to read. Those two, and only
those two, can also be satisfied by an explicit written statement in the project's own documents
— and it has to be specific. "Staging is safe" is not a statement; "staging does not promote to
production automatically" and "staging uses separate credentials for the mail provider" are.
**Anything you detect beats anything you were told:** a CI config showing a production job
downstream of staging with no approval gate overrules a document claiming otherwise.

When a precondition fails, **don't push and don't deploy**. Finish the issue on the evidence you
have, and name which precondition couldn't be met. Borrowing `/board`'s own phrasing: if you
can't prove it, it isn't proven — that's a respectable answer, and a deploy you couldn't justify
is not.

---

## Output

Written for someone who has been away for hours and wants the shape in ten seconds.

1. **Done** — one line each: issue, branch, and the command whose output proves it. Not "fixed".
2. **Ejected** — one line each: issue, which condition failed, and what a human needs to do next.
3. **Decisions that are yours** — the questions the run refused to answer, as questions.
4. **What didn't reach the tracker** — per issue, if writes were skipped or unavailable.
5. **Budget** — issues worked against the run's limit, pushes and deploys against theirs.

Numbers, not adjectives. "7 admitted, 5 landed, 2 ejected" beats "mostly went well".

---

## Persist

The run log goes to `.camp/haul-<date>.md` and is written **as you go**, not at the end: ground
truth, the queue table with each issue's admission verdict, and the evidence per issue. Ejected
issues get their own in-flight working log so `/break` can resume them.

---

## Anti-patterns

- **Admitting on a label.** The ticket's own description is not evidence. Run the reproduction.
- **Fixing something that doesn't reproduce.** That's a guess with a commit message.
- **Deciding, quietly.** If you picked between two defensible behaviours, you made a product
  decision alone. Eject instead.
- **Committing to the default branch** because the project's convention or a loaded memory says
  that's how this repo works. Not unattended, it isn't.
- **Bypassing hooks.** `--no-verify` assumes someone to ask. There is no one.
- **Pushing through a failing check** because the fix "obviously" works.
- **Working issues in parallel** to save time, and producing a git state nobody can review.
- **Reporting every issue done.** On a real board that means the admission test didn't bite.
- **A deploy on an unverifiable precondition.** The refusal is the feature.

---

## Next

Queue's worked. `/clean` to verify a landed issue against what it claimed, `/break <slug>` to
pick up anything ejected, `/track` for one that turned out to have a real bug behind it.
Decisions in the report are yours — answer them and the next run's queue is longer.
