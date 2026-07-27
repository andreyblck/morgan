---
name: board
description: Sweep the tracker board — audit every in-flight issue against production, close what's proven, give the rest an honest status.
argument-hint: "[assignee | statuses | issue keys]"
---

# /board

Read the ledger. Settle the accounts.

---

## Intent

Your board says thirty things are in flight. Most of them aren't. Some shipped weeks ago and
nobody closed them; some never started; some are half-shipped and lying about it.

This command settles each one against production and leaves the board telling the truth. Two
jobs, and the second is the one people skip:

1. **Clean the board** — close what's provably live, correct the status of what isn't.
2. **Find out why it filled up** — a board that re-accumulates is a broken pipeline, not a
   messy desk. Cleaning it without fixing the cause means running this again next week.

---

## Load skill

Before you do anything else, in this order:

1. Load the `morgan` skill.
2. Read `references/tracing.md` and `references/verification.md`. That's the method this command runs on — you can't execute the process below without them. Read them now even if you loaded the skill or other references earlier in this session: each command runs on its own, and the ones already in context are not these.

Don't start the work until they're read.

---

## Start

$ARGUMENTS

Default scope when no arguments: **every issue assigned to the user in a started state**
(In Progress, In Review, or that tracker's equivalents). If arguments name an assignee, a set of
statuses, or specific issue keys, use those instead.

---

## The rule that governs everything here

**Only behavioural production proof earns a Done.** Code on the release branch plus a green
deploy is *structural* evidence. It tells you the change exists. It does not tell you the change
runs, or that the reported symptom is gone.

A fix behind an off-by-default flag is not done. A fix whose data-repair backfill never ran is
not done. Two of three parts of a cluster ticket is not done. Say so, and leave it open.

This is the `verification` reference's traceability loop — requirement → implementation → tests →
verified — run against work that already shipped. The loop's last link is the one boards skip: it
closes on *observed production behaviour*, not on a merge.

If you can't prove it, it isn't proven. Write "unverified" and move on — that is a respectable
answer and a false Done is not.

---

## 1. Establish ground truth once

Per-issue verification will tempt you to re-derive this thirty times. Do it once, write it down,
reuse it.

- What is the deployed production revision, per repo? Not the release branch head — the revision
  actually running. Read it off the host or the deployment record.
- Was the deploy that carried it green?
- What is the branch model? Which merge means "in production"? Where do feature PRs land?
- How do you reach production read-only — host, database, telemetry, the live site?

**Read the project's own conventions before guessing any of this.** `CLAUDE.md`, the project's
memory or docs directory, and the deploy configuration will tell you the branch model, the deploy
gate and the access paths. Guessing them wastes a whole sweep.

If a previous sweep left a working log in `.camp/`, read it first. Its ruled-out theories and
gotchas are the cheapest evidence you will get all session, and re-walking them is pure waste.

---

## 2. Classify in bulk before you verify anything

Verification is expensive; classification is nearly free. Do the cheap pass on all of them first,
because it removes most of the board from the expensive pass.

For every issue, mechanically resolve: is there a branch, a PR, a commit? What did the PR merge
into? Is a commit naming this issue an ancestor of the deployed revision?

Pull the whole PR list per repo in one call and match issue keys against titles and branch names.
Do not open thirty PRs one at a time.

| Class | Meaning | What it needs |
|---|---|---|
| **On prod** | commit naming it is an ancestor of the deployed revision | expensive verification — this is your candidate set |
| **Merged, not released** | landed on the integration branch only | status correction; note what it's waiting for |
| **PR open** | code exists, unmerged | nothing is in production; status is probably already right |
| **No code** | no branch, no PR, no commit | either it never started, or the deliverable isn't code — find out which |
| **Umbrella** | objective / epic / KR — not a shippable unit | judge against its own criteria, never against a commit |

Two traps in this pass:

- **A ticket's own description is not evidence.** Tickets that say "SHIPPED this run" while no
  commit naming them is an ancestor of the prod revision are common. Check, don't read.
- **"No code" can mean the deliverable was a document.** An analysis or write-up ticket ships
  when its artefact reaches the ticket. If the artefact exists but sits in a scratch directory, the
  work is done and the *delivery* isn't — say that precisely, because the fix is one comment, not
  a sprint.

---

## 3. Fan out the crew

One agent per issue, or per tight cluster of issues that share a file and a verification shape.
Independent work — run them concurrently, don't serialise.

Match the crew to the evidence you need:

- **Charles** — the default. Code on the deployed revision, git and PR history, deploy status.
- **Tilly** — anything user-visible. A prod screenshot is the proof; she drives the browser.
- **Hosea** — the refute pass, and any issue whose trail has gone cold.
- **Sadie** — security tickets, where the question is whether the hole is actually closed.

Brief every agent with: the issue key, its acceptance criteria, the fix's PRs and files, the
ground truth from step 1, the access paths, and anything already known that they should verify
rather than trust. They don't load this skill and they don't know the codebase.

**Four things in every brief, non-negotiable:**

1. **Read-only.** Never mutate the tracker, never write to a production database, never push,
   never restart a process. They gather evidence; you decide.
2. **Evidence is a command you ran plus its raw output.** No paraphrase, no "presumably".
3. **Return a verdict per issue** — ready / not ready / blocked — with what specifically remains.
4. **Name the one check that would prove the verdict wrong.**

Then **run that falsifier.** Every "ready to close" verdict gets an adversarial second pass whose
job is to refute it, not confirm it — default to refuted when it can't independently observe the
behaviour. Send Hosea. Hunt specifically for: a flag that's off, a backfill never run, evidence
that's structural only, a multi-part ticket that half-shipped, a symptom that still reproduces.

Validate what comes back. An agent asserting "verified on prod" with no command in its evidence
has verified nothing.

---

## 4. Apply the transitions

Now, and only now, touch the tracker.

**Before every single write, check the assignee.** Closing someone else's ticket is their call,
however green the deploy was. It's one field on an object you already fetched — never the thing
to cut, and never the thing to cut *because you're in a hurry*.

- **Proven on prod, assigned to the user → Done.** Post the evidence as a comment first, so the
  flip is auditable by whoever reported it. If the tracker mirrors comments into chat, post
  top-level or skip the comment rather than burying it in a synced thread.
- **Shipped but unproven → leave it, and comment what proof is missing.** Precisely what, so the
  next pass can go get it.
- **Started with nothing behind it → back to the unstarted column.** An issue in progress with no
  branch, no PR and no commit is noise on the board and it distorts every cycle metric.
- **Umbrella / objective → judge it against its own key results,** never against a merge. If the
  cycle is over and the children are all settled, say so and ask — don't close an objective on
  your own authority.
- **Superseded or duplicated → link it and say which one supersedes.** Don't close it silently.

Never create new tickets for what you found without asking first. Propose them in the report and
wait.

---

## 5. Report

Lead with the answer to "why so many", then the ledger. What the user needs, in this order:

1. **The cause of the pile-up**, with the evidence that proves it.
2. **What you closed**, one line of proof each.
3. **What you held back and why** — the honest column, and the one that earns trust.
4. **New defects found while verifying.** Verification finds bugs; they're worth more than the
   cleanup. Each one gets its ticket's own comment.
5. **Decisions that are the owner's, not yours.** Ask them plainly, in one list.

Numbers, not adjectives. "17 of 38 had a fix on prod; 6 survived refutation" beats "most were
fine".

---

## 6. Root-cause the pile-up

This is the half that makes the command worth running. Treat the board itself as the symptom and
work it like any other bug — the `tracing` reference applies as written.

Ask what actually writes status in this pipeline. Usually it isn't a person. A tracker wired to
git will move issues on branch and PR events, and its terminal state is whatever "merged" maps
to — which, when teams merge into an integration branch rather than the default one, is never
Done. Nothing observes production. So the board becomes a log of PR events rather than a record
of delivered work, and it fills up by design.

Prove it before you claim it. Compare status-transition timestamps against PR creation and merge
timestamps: a flip two seconds after a PR event was not a human, and two issues flipping
milliseconds apart came from one event naming both keys. That's a toggle you can run, not a story
you can tell.

Watch for the amplifier too: if the integration reopens an issue whenever a new PR mentions its
key, long-lived epics can never stay closed. An issue with dozens of transitions and several
Done→started reversals is that mechanism leaving fingerprints.

Then measure the inflow — how many of these were created since the last sweep, and by what. If
automation opens issues faster than you close them, cleaning is a treadmill and the finding is the
rate, not the pile. Say the number.

**Recurrence means the last cleanup treated symptoms.** If a previous sweep's log is sitting in
`.camp/`, that's not reassurance — it's the evidence that a rule is missing. Propose the rule.

---

## Persist

Write the trail to `.camp/track-board-<date>.md` **as you go**, not at the end: ground truth, the
classification table, ruled-out theories with the evidence that killed them, and the per-issue
verdicts. The next sweep reads it and skips your dead ends. Sweeps recur — the log is what makes
the next one cheaper than this one.

---

## Anti-patterns

- **Flipping on structural evidence.** Code on the release branch and a green deploy. The single
  most common way this command goes wrong.
- **Closing a teammate's ticket.** Not yours to close. Check the assignee before every write.
- **Trusting the ticket's own description.** "SHIPPED" in a description is a claim, not a fact.
- **Verifying in main context.** Thirty issues will bury you. Delegate, then validate.
- **Re-deriving ground truth per issue.** Establish the deployed revision once.
- **Cleaning without diagnosing.** You'll be back next week with the same board.
- **A `[~]` deferred-proof caveat.** That notation means you knew the proof was missing and
  flipped anyway. Get the proof or don't flip.
- **Silent truncation.** If you only verified the top twenty, say which eighteen you didn't.

---

## Next

Board honest and the cause named? `/camp` to seal it.
Cause needs a fix in the pipeline? `/scope` it — a missing automation rule is real work.
Verification turned up defects? `/track` the worst one.

---

A clean board isn't the point. A board you can trust is.
