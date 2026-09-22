# Fleet

How `/haul` works a queue with several workers at once, and how it carries work past a branch —
merged, promoted, proven where it runs. Loaded by `/haul` only when the run was started with
`--fleet` or `--to`.

---

## The point

The default `/haul` is right for what it promises: one issue at a time, a branch, nothing merged,
nothing deployed. What it cannot do is move a board. A branch nobody merges is work that hasn't
reached anyone, and a board where Todo shrinks while In Progress grows is a board that looks busy
and ships nothing.

When a run is widened, the bottleneck is never the agents. It is three things:

- **CI capacity.** Every worker waits on the same pipelines.
- **Foreign breakage.** Someone else's merge turns the integration lane red, and nothing deploys
  for anyone until it's green again.
- **The tracker drifting from reality.** Merged work sitting in a started status; fixed work
  sitting in Todo because nobody checked.

The flags exist to manage those three, not to go faster by skipping checks. **Every flag here
adds gates. None removes one.** This is not a `--force`.

---

## Two axes

Parallelism says how many issues move at once. Reach says how far each one is allowed to travel.
They are independent.

| Invocation | Workers | Reach | Who merges | What "done" means |
|---|---|---|---|---|
| `/haul` | 1, sequential | branch | nobody | a branch and the run log — unchanged |
| `/haul --fleet N` | up to N in parallel | branch | nobody | branches and one ledger |
| `/haul --to staging` | 1 | merged to the pre-production target | the orchestrator | merged, and proven there by behaviour |
| `/haul --fleet N --to staging` | up to N | merged to the pre-production target | the orchestrator | merged, and proven there by behaviour |
| `/haul --fleet N --to prod` | up to N | promoted to production | the orchestrator | proven in production by behaviour; tracker at its terminal status |

- `--fleet` with no number means the project's declared default, or 3 if it declares none. The
  orchestrator may run fewer workers when CI is saturated. It never runs more than N.
- `--ship` is an alias for `--to prod`.
- `staging` and `prod` are roles, not branch names. The project's ship recipe says which branch
  and which environment play each role. A project with one environment has no `staging` role, and
  `--to staging` is refused there.
- **`--to` needs a ship recipe** (below). Without one, refuse the flag in one line that says what
  is missing, and run at branch reach. `--fleet` alone needs no recipe — it never leaves a branch.

---

## Roles

The main session becomes an orchestrator. It holds the queue, the ledger and the shipping steps,
and nothing else. Every issue gets a fresh worker. That split is what keeps context cost per issue
instead of cumulative: an orchestrator that also writes code runs out of room around the fourth
issue and loses its place.

| Role | Count | Owns | Never does |
|---|---|---|---|
| **Orchestrator** — the main session | 1 | admission, the ledger, lane health, merge, promote, deploy watch, probes, tracker writes, close-out, cleanup | writes feature code |
| **Worker** | 1 to N | one issue: confirm it's still real, reproduce, fix, test, open the PR, write the probe | waits on CI past the cap, merges, promotes, writes to the tracker |
| **UI verifier** — Tilly | 1 per wave | browser proof for every UI change in the wave, pre-production first, production after | a real write in production |
| **Unblock agent** | on demand | a red integration lane that isn't the run's own: attribute it, fix it when it's bookkeeping, report it when it's a defect | allowlist a genuine security finding to turn the lane green |

- **A worker is a fresh agent reading the standing brief, not a fork of the orchestrator.** A fork
  inherits the whole parent context and costs several times as much for no gain — the worker needs
  the brief and the issue, not the run's history.
- **Connectors usually belong to the main session only.** The tracker, the error monitor, the chat
  tool. The orchestrator pulls the ticket text and telemetry and hands them to the worker as given
  facts. Do this at admission, while the connectors are alive: a connector that drops mid-run
  leaves every unresolved ticket unresearchable.
- **Each worker works in its own worktree**, created fresh from the integration branch, with
  absolute paths. Two workers in one checkout is the unreviewable git state the default mode
  forbids.

---

## Admission, split in two

The four conditions in `/haul` §2 still hold for every issue in every mode. What changes is who
checks which.

- **The orchestrator, once, before any spawn:** pull the queue, drop what the user excluded,
  resolve wrapper tickets to their original source, and check conditions 2, 3 and 4 — the ones
  decided by reading. Classify each admitted issue as *build*, *verify-only* (probably already
  fixed), or *investigation* (the definition of done is a report). Print the admitted table and the
  excluded table, each exclusion with its reason.
- **The worker, first thing:** condition 1. Confirm the issue is still real — not already fixed on
  the integration branch or in production — and reproduce it as a command it ran. Failing that is
  an ejection or an `ALREADY_FIXED`, reported like any other outcome.

Condition 4 — no external effect without confirmed non-production credentials — is not relaxed by
any reach. A fix that sends real mail from a pre-production environment has the same blast radius
whether or not the run was allowed to merge.

---

## Per-issue states

Every issue is in exactly one state, and **the tracker follows the state the moment it changes.**
A merged issue left in a started status is the failure this whole section exists to prevent.

```
Admitted ─▶ Building ─┬─▶ PR open ─▶ Merged ─▶ Pre-prod proven ─▶ Promoted ─▶ Prod proven
                      ├─▶ Already fixed
                      ├─▶ Needs decision
                      └─▶ Blocked
```

Status names below are roles. Map them to the project's own statuses once, at ground truth.

| State | Tracker status | Written when | Leaves when |
|---|---|---|---|
| Admitted | ready | — | a worker claims it |
| Building | started | the orchestrator spawns the worker | the worker reports |
| PR open | started | — | the PR's own checks are green |
| Merged | review | the orchestrator merges | the target environment runs the merged revision |
| Pre-prod proven | review | the probe and its control pass there | promoted (`--to prod` only) |
| Prod proven | **terminal**, with the evidence comment | the probe and its control pass in production | — |
| Already fixed | **terminal** at `--to prod`; review otherwise; with the evidence comment | proven on what's deployed | — |
| Needs decision | back to **ready**, with the question as a comment | the worker stops at a product call | the user answers |
| Shipped, one criterion waits on a decision | **review**, with the question | — | the user answers |
| Blocked | unchanged, with what would unblock it | — | the blocker clears |

**The terminal status is written only at `--to prod`, and only on behavioural proof in
production.** Done means every acceptance criterion is met, not that the code reached an
environment. At `--to staging` the last state is *Pre-prod proven*, in review. At branch reach the
tracker limits in the `tracker` reference hold unchanged.

---

## The probe

A probe is how the orchestrator proves an issue is fixed where it runs, without the worker. The
worker writes it; the orchestrator runs it.

- **It is behavioural.** A request made and a response read. A row compared. A page driven and
  what it shows read back. A green check, a merged PR, a deploy that succeeded, or a marker string
  found in the build is **structural** evidence — it says the code arrived, not that it works.
- **It carries a control.** Evidence that this probe can fail: the same probe against a revision
  without the fix, or the observation from before the fix was deployed. A probe that would have
  passed on the old code proves nothing — it is `building`'s first test condition, applied to an
  environment.
- **In production it is read-only.** Reads only against data stores. Anything that must exercise
  a write path runs inside a transaction that is rolled back. Browser proofs intercept every write
  in the browser, and the proof includes checking server-side that none arrived. A probe that needs
  a real write in production is a decision — return it as one.
- **It is an exact command with its expected output**, runnable as written. "Check the page" is
  not a probe.

---

## Worker contract

A worker is briefed by one standing brief plus the issue, and ends with a report in a fixed shape.
Writing the brief once per run means spawning a worker costs a few lines instead of a bespoke
prompt, and every worker plays by the same rules.

**The brief** is generated at the start of the run from `templates/fleet-brief.md`, with its slots
filled from ground truth and the ship recipe, and written to `.camp/haul-<date>-brief.md`. Workers
don't load references, so the brief carries the standards inline — the template already does.

**Order of work:** confirm it's still real → reproduce as a command → name two or three candidate
causes and kill the wrong ones → failing test → fix → project checks → PR → probe with control.

**Exactly one status per report:**

| Status | Meaning |
|---|---|
| `PR_READY` | PR open, its own checks green, probe written |
| `PR_OPEN_AWAITING_CI` | PR open, its own checks still running at the cap — the orchestrator takes it from here |
| `ALREADY_FIXED` | proven on what's deployed, with the probe that shows it; no PR |
| `NEEDS_DECISION` | stopped at a product call; one question, with the options |
| `BLOCKED` | access, environment, or breakage that isn't this issue's; what would unblock it |

**The CI cap.** One bounded wait on the PR's own checks, 20 minutes unless the recipe says
otherwise. Past it, report `PR_OPEN_AWAITING_CI` and stop. No second wait, no polling loop. A
worker waiting on CI re-reads its whole context on every check, and one that waits two hours costs
more than the fix did.

**The report shape:** status · PR and head revision · root cause with `file:line` · files changed ·
each test and what it asserts · the PR's checks · the probe as an exact command, its expected
output, and its control · risks and anything it went wider than the ticket · the question, if
there is one.

---

## Orchestrator contract

The orchestrator owns everything that waits on infrastructure, so no worker ever waits on it. It
runs the helper commands the recipe names. Where the recipe names none, it uses the host's own
tooling directly and follows the rules below exactly — improvising a waiter mid-run is how a
cancelled run gets read as a failure.

1. **Admission**, once, before any spawn — above.
2. **Claim.** Move the issue to started as the first write, then spawn the worker, then record it
   in the ledger.
3. **Lane health before every merge wave.** Read the integration branch's latest completed CI run.
   Red means nothing deploys, for anyone. Attribute it by **the merge whose run first went red** —
   not by the last commit to touch the failing file, which finds the last person who edited it, not
   the one who broke it. Then dispatch the unblock agent and put the run in drain.
4. **Merge** when a PR's own checks are green. A check that is red on the integration tip for
   everyone is judged, not obeyed: set aside only when the PR provably doesn't touch what it guards
   — a schema check on a PR with no schema change. **Every judgement goes in the ledger**, with the
   reason. Security checks are never set aside.
5. **Before merging, dry-run the promote** at `--to prod`: apply this issue's change onto the
   production branch without committing. A conflict found now costs one issue; found at promote
   time, it costs a merged change that can't ship.
6. **Deploy watch.** One wait per revision. "Deployed" means a completed deploy whose revision
   contains this merge — not "the newest run", which may be one still pending. A cancelled run was
   superseded, not failed. Then read the revision the running environment reports about itself;
   the pipeline's word for it is not enough.
7. **Probe.** Run the worker's probe and its control against the environment. Write both outputs
   to the ledger.
8. **Promote** (`--to prod` only). Scoped, one issue at a time: carry only this issue's merge onto
   the production branch, confirm the change carries exactly this issue's files and no migration,
   merge it, watch the production deploy, probe again. A promote that conflicts is parked — never
   resolved by hand against other people's work.
9. **Close-out.** The evidence comment first — PRs, revisions, probe and control output. Then the
   transition. Then a short plain-language reply for the person who reported it, **drafted and
   held for the user's go**; it is never posted by the run.
10. **Cleanup, per issue.** Remove the worktree and, once merged, the remote branch. Take off any
    label that keeps expensive CI running on a merged PR. Restore anything a probe changed, and
    prove it was restored. Cleanup is part of closing an issue, not something for the end of the
    run — a run that leaves twenty worktrees behind has handed its mess to the next one.
    **Clean up only what this run created.** Before deleting a branch, worktree or file, check it
    against the list of what the run made — the ledger holds it, and the run marker identifies it.
    A branch that existed before the run started is not the run's to delete, even when it looks
    stale.
    At branch reach there is no close-out, so the worktree goes as soon as the worker's report is
    checked: the branch is what a human reviews, and the worktree is only where it was built.
11. **Batch the UI proofs.** One verifier run per wave covers every UI change in it: pre-production
    first, production after the promote, writes intercepted in production.

---

## Limits, and drain

Two limits. Intake stops the moment either is hit.

| Limit | Default | When hit |
|---|---|---|
| Workers in flight | N | no new spawn until one reports |
| Merged but not yet proven at the target | 2 × N | **drain**: no new issues; the orchestrator probes, promotes and closes until the backlog is under the limit |

Without the second limit the run looks productive while nothing reaches the target. Merging is
cheap; proving is where the time goes, and intake has to wait for it.

- **A red integration lane also means drain.** More work on a lane that cannot deploy only grows
  the pile.
- **In drain, tell the user** which issues are waiting on what — deploy, probe, promote — and the
  terminal count so far.
- **The ledger shows three numbers at all times:** in flight, merged-not-proven, done.
- The recipe may change both defaults. Nothing else may.

---

## Invariants no flag relaxes

These hold for every combination, including `--fleet N --to prod`.

- **No product decision is made silently.** It becomes `NEEDS_DECISION`. The run returns the
  question; it doesn't answer it.
- **No migration, backfill, or write to production data** without the user's explicit go for that
  specific change. A run started with `--to prod` has not been given that go.
- **No bulk promote.** Production receives only scoped, per-issue promotes whose change equals the
  issue's own diff.
- **No force-push, no push to a protected branch** except the merge and promote steps the recipe
  defines. Pushes name their refspec explicitly.
- **Production probes are read-only.**
- **A security check is never allowlisted to make a lane green.** A genuine authorisation or
  isolation gap is the blocker, and it is reported as one.
- **Nothing outbound to a person without the user's go** — chat, email, a tracker reply that
  mirrors to chat. Drafts go in the report.
- **Hooks follow the project's declared policy.** The one relaxation: under `--fleet`, a project may
  declare that its pre-commit checks run in CI instead — see the recipe — and only when the CI
  config visibly runs the same checks on every PR. Then workers run the fast local checks and
  commit, and no PR merges until CI is green. Without that declaration, `--no-verify` stays
  forbidden, in every mode.
- **Terminal means every acceptance criterion met, proven where the flag says.** A remaining
  criterion that needs a decision keeps the issue in review.
- **Everything the run touches carries its marker** — commits, branches, PRs, comments — so
  whoever finds it later knows what it was and where the ledger is.

---

## The ship recipe

Morgan owns the shape of the run. The project owns how its code ships. The recipe is where the
project says so, and `--to` is refused without it.

Read it from the project's own documents — its `CLAUDE.md`, or its override of the
project-context reference, which carries a skeleton. Everything in it must be specific: "deploys
are automatic" is not a recipe, "merging to `develop` deploys the staging environment; production
deploys from `main`" is.

| Morgan decides, in the plugin | The project declares, in its recipe |
|---|---|
| flags, roles, states, worker statuses | which branch and environment play `staging` and `prod`; how a change is promoted |
| the brief and ledger templates | the brief's slots: layout, local rules, hook policy, CI traps |
| the worker contract, the CI cap, the report shape | how to reach each environment for a read-only probe |
| the orchestrator contract, limits, drain | the helper commands: wait for a deploy, read the deployed revision, merge when green, scoped promote |
| lane health, first-red attribution | which lane checks are known to be foreign and how to recognise them |
| close-out and cleanup | where evidence comments and reporter replies go |

**At reach, the recipe replaces `/haul` §6 for the merge and promote steps only.** Those
steps go where the recipe says they go, and nowhere else. Everything else a worker pushes is a
branch, and §6's push conditions — not protected, not someone else's, within budget, marked —
still apply to it.

**Anything detected beats anything declared**, the same rule as `/haul` §6. A recipe that says
pre-production never promotes itself is overruled by a CI config that promotes it with no approval
gate — and then `--to staging` would really be `--to prod`, so refuse it and say why.

---

## Anti-patterns

- **Reading "merged" as "done".** Merged is structural. Done is behavioural, in production.
- **Merging faster than you prove.** The second limit exists because this is what a busy run does
  by default.
- **A worker polling CI.** One bounded wait, then hand it over.
- **Forking the orchestrator to make a worker.** The worker needs the brief, not the history.
- **Blaming the last toucher for a red lane.** Attribute by the first red merge.
- **Obeying a foreign red check, or silently ignoring one.** Judge it, and write the judgement
  down.
- **Hand-resolving a promote conflict** against someone else's work.
- **A probe with no control.** It proves the code runs, not that it's fixed.
- **Posting to a reporter on the run's own authority.** Draft it; the user sends it.
- **Cleanup at the end.** By then there are twenty worktrees and nobody knows which are safe.
