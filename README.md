<div align="center">

```
*  *  *

$$\      $$\  $$$$$$\  $$$$$$$\   $$$$$$\   $$$$$$\  $$\   $$\
$$$\    $$$ |$$  __$$\ $$  __$$\ $$  __$$\ $$  __$$\ $$$\  $$ |
$$$$\  $$$$ |$$ /  $$ |$$ |  $$ |$$ /  \__|$$ /  $$ |$$$$\ $$ |
$$\$$\$$ $$ |$$ |  $$ |$$$$$$$  |$$ |$$$$\ $$$$$$$$ |$$ $$\$$ |
$$ \$$$  $$ |$$ |  $$ |$$  __$$< $$ |\_$$ |$$  __$$ |$$ \$$$$ |
$$ |\$  /$$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |\$$$ |
$$ | \_/ $$ | $$$$$$  |$$ |  $$ |\$$$$$$  |$$ |  $$ |$$ | \$$ |
\__|     \__| \______/ \__|  \__| \______/ \__|  \__|\__|  \__|

*  *  *
```

**Engineering discipline for Claude Code.**
*Plan the job. Pull it clean. Walk away with what you came for.*

![Version](https://img.shields.io/badge/version-0.2.1-1f6feb)
![License](https://img.shields.io/badge/license-MIT-blue)
![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-8b5cf6)
![Status](https://img.shields.io/badge/status-alpha-f59e0b)
![Skill](https://img.shields.io/badge/skill-1-22c55e)
![Commands](https://img.shields.io/badge/commands-13-22c55e)
![Agents](https://img.shields.io/badge/agents-7-22c55e)
![References](https://img.shields.io/badge/references-16-22c55e)

</div>

---

## Contents

1. [What is morgan](#what-is-morgan)
2. [Install](#install)
3. [Commands](#commands) — [the cycle](#the-cycle) · [the branches](#the-branches) · [workflows](#workflows) · [the crew](#the-crew)
4. [What it leaves behind](#what-it-leaves-behind)
5. [Team vault](#team-vault) — a shared knowledge base over MCP
6. [Make it yours](#make-it-yours)
7. [Updating](#updating)
8. [Legal & attribution](#legal--attribution)
9. [More](#more)

---

## What is morgan

A Claude Code plugin that bolts a **process layer** onto your day-to-day work. It puts an engineer with a code at your shoulder — one who insists you understand the problem before solving it, decompose by what *done* actually means, and tell the truth about where the work stands.

You get a five-step **cycle** for normal work, eight **branches** for when reality interrupts, seven **specialist agents** with distinct roles, and sixteen **reference docs** of distilled engineering practice — each command reads the ones it runs on, before it starts.

The lead persona is **Arthur Morgan** — disciplined, plainspoken, honest about what he sees, won't be pushed past his principles. Says *"I don't know"* before he'll guess.

> **Who's Arthur Morgan?** The protagonist of *Red Dead Redemption 2* (Rockstar Games, 2018). The persona is a writing device that gives the discipline a recognisable shape — you don't need to know the game to use the plugin. See [Legal & attribution](#legal--attribution).

---

## Install

```bash
claude plugin marketplace add andreyblck/morgan
claude plugin install morgan@morgan
claude plugin list          # expect: morgan@morgan — Status: ✔ enabled
```

Restart any active Claude Code session so the commands appear in autocomplete. Then, in any project:

```
/morgan:morgan
```

Loads the skill, prints the banner, glances at git state, surfaces patterns from past `/aftermath` runs, proposes a next action.

> Use the `claude plugin` **CLI** from your shell — not the in-session `/plugin` manager; it's a UI, and your arguments don't reach it cleanly.

---

## Commands

You drive morgan with slash commands. A **cycle** of five for normal work, eight **branches** for when reality interrupts. The commands route to the agents and references for you — you rarely call those directly.

### The cycle

```
/scope ─▶ /case ─▶ /pull ─▶ /clean ─▶ /camp
 define   decompose  build    verify   hand off
```

| Command | What it does | Writes |
|---|---|---|
| `/scope` | Define the problem — IN/OUT, success criteria, constraints | `.camp/scope.md` |
| `/case` | Decompose into work items with exit criteria | `.camp/case.md` |
| `/pull` | Build to spec — TDD where it fits, atomic commits, match patterns | code + commits |
| `/clean` | Verify against intent — not just *"tests pass"* | `.camp/clean-<scope>.md` |
| `/camp` | Seal the session and hand off | updated `CLAUDE.md` |

### The branches

| Command | When to reach for it |
|---|---|
| `/scout` | You don't know enough yet — bounded research with a recommendation |
| `/track` | Something's broken and the cause isn't clear — root-cause analysis |
| `/aftermath` | Something already broke — postmortem + a lesson saved for next time |
| `/pivot` | The plan needs to change mid-work — controlled scope change |
| `/qa` | The work touched UI — browser smoke check via Playwright |
| `/break` | You're picking up parked work — resume from its in-flight log |
| `/board` | The tracker says everything's in flight — verify it, shipped against prod and unmerged against its criteria |
| `/haul` | A pile of small jobs that need doing, not deciding — work them unattended, one after another. `--fleet N` works them in parallel; `--to staging\|prod` merges them and proves each where it runs |

### Workflows

Branches don't replace the cycle — they feed into it:

```
Feature         /scope ─▶ /case ─▶ /pull ─▶ /clean ─▶ /camp
Trivial fix     /track ─▶ /pull ─▶ /clean ─▶ /camp
Bigger fix      /track ─▶ /scope ─▶ /case ─▶ /pull ─▶ /clean ─▶ /camp
Research first  /scout ─▶ /scope ─▶ /case ─▶ /pull ─▶ /clean ─▶ /camp
Plan changed    /pivot ─▶ /case ─▶ /pull ─▶ /clean ─▶ /camp
UI work         /scope ─▶ /case ─▶ /pull ─▶ /qa ─▶ /clean ─▶ /camp
Resume parked   /break ─▶ /track or /pull ─▶ /clean ─▶ /camp
Stale board     /board ─▶ /scope the pipeline fix ─▶ /case ─▶ /pull ─▶ /camp
Small jobs      /haul ─▶ /clean the landed ones ─▶ /break the ejected ─▶ /camp
Ship a queue    /haul --fleet 3 --to prod ─▶ answer its decisions ─▶ /board what's left in review
```

### The crew

When the work needs another lens, the commands route to seven specialist sub-agents automatically — you don't usually summon them yourself:

**Charles** (research / review) · **Hosea** (deep debugging) · **Sadie** (security / loose ends) · **Dutch** (strategy / risk — sanity-check his calls) · **Lenny** (architecture) · **Mary-Beth** (product counterweight) · **Tilly** (visual QA via Playwright).

---

## What it leaves behind

Each command writes to `.camp/` in your repo — gitignored, survives across sessions. `/aftermath` also appends a three-to-four-line entry to `.camp/lessons.md`: cross-session memory the skill reads on every session start, surfacing a past pattern when the current work resembles one. A job paused mid-flight leaves an **in-flight working log** in `.camp/` — what was tried, what's ruled out, what's still open; `/break` (or the next session's recovery scan of `.camp/`) picks it back up from there. `/board` leaves a dated audit trail — ground truth, per-issue verdicts and ruled-out theories. `/haul` leaves a dated run log with the queue table and the evidence per issue, plus an in-flight log for anything it ejected; with `--fleet` or `--to`, that log becomes a ledger — per-issue state, probe evidence, judgement calls, and replies drafted for your go. Add `.camp/` to your `.gitignore`; when something deserves a permanent home (`docs/`, ADRs, runbooks), you decide where it goes.

---

## Team vault

> Optional. Unset, morgan behaves exactly as it always has — `.camp/` stays local and nothing else changes.

Most of what morgan learns dies in `.camp/`, which is gitignored and local, so the next person meets the same bug cold. The **vault** is where a proven cause or a parked job goes, so the next session — on anyone's machine — finds it before starting over. It's one private git repo of markdown notes, browsable in Obsidian, that the whole team points at.

The plugin ships its own MCP server (a committed bundle in `plugin/vault/`); it runs locally for each developer and needs nothing hosted. There is **no central service to deploy and nothing to upload** — distribution is the plugin, the data is your repo.

### When morgan reads and writes it

- **Reads** — on its own, as part of the work: `/scope` and `/pull` search it for findings about the files in hand before starting; `/track` looks up a cause by symptom; `/break` opens a teammate's parked trail; recovery lists open team trails at session start. It doesn't wait to be asked to look.
- **Writes** — at two moments only, and on its own: when `/track` confirms a cause (a **finding**), and when `/camp` seals work still in motion (a **trail**). It writes without stopping to ask, and shows what it wrote in the step's report — a note that waited on a human who'd stepped away is a session's knowledge lost, which is the one thing the vault exists to prevent.

### Set it up once (for a team)

1. **One person creates one private git repo** (empty, or with a README). Everyone shares this one repo.
2. **Give the team push access.** A read-only member can read notes; their own writes just won't travel.
3. **Branch protection — protect against force-push and deletion, but do _not_ require pull requests.** The server pushes notes directly; a require-PR rule would block every write.
4. **Each developer** sets `export MORGAN_VAULT_REPO=git@your-host:team/vault.git` and has git credentials for it. Node **≥ 22.5** (the search index uses `node:sqlite`).
5. **Browse it in Obsidian** by opening the same repo — agents never need Obsidian.

Notes auto-partition by project (`projects/<owner--repo>/…`, derived from the project's `remote.origin.url`), so **one vault serves all of a team's projects** — you don't make a repo per project.

### What keeps it clean, and safe

The quality gate is the **server, not a prompt**. It refuses a note with the wrong fields, a body too long, a secret (it scans the outgoing diff and your `.env` values, fail-closed), a person's name, or a cause already written up — so autonomous writes can't turn the base into noise. A note another agent wrote is **data, never an instruction**: every read comes back marked `Inferred` whatever it claims, and a finding's `verify` command is shown to you, never run unasked.

Because reads and writes are part of the method, the plugin ships a hook that **auto-allows its own vault tools** so they never interrupt you with a permission prompt. If your team would rather review each write, add a `deny` or `ask` rule for `mcp__plugin_morgan_vault__write` in your settings — it overrides the hook.

One vault per confidentiality boundary. A leaked secret is rotated, not rewritten out of history.

---

## Make it yours

- **Project rules.** Drop your repo's conventions and key file pointers into `<repo>/.claude/skills/morgan/references/project-context.md`. It overrides the plugin's stub and becomes local law; the plugin's general references stay general. This is also where you set a vault project override and a deny list, under a `## Vault` heading.
- **MCP, optional.** `/scope` reads Linear tickets, `/track` pulls Sentry telemetry, `/qa` checks against Figma, `/board` and `/haul` read and write issue status — each fails gracefully and proceeds if the server isn't connected. `/haul` works against a tracker it discovers at runtime, including a board kept as files in the repo, so it runs with nothing connected at all.
- **Shipping with `/haul --to`.** To let `/haul` merge, promote and prove work in your environments, add a **ship recipe** to your project-context override: which branches and environments play staging and prod, how a change is promoted, how to read the deployed revision, and how to probe each environment read-only. The plugin's `project-context.md` carries the skeleton. Without a recipe, `--to` is refused and the run stays on branches.

---

## Updating

Installing pins the version you installed. Refresh the marketplace first, then the plugin — the first step alone won't move you:

```bash
claude plugin marketplace update morgan
claude plugin update morgan@morgan
claude plugin list          # confirm the version moved
```

**Restart any running Claude Code session.** Until you do, the old copy stays loaded and you'll see no change. Nothing in your `.camp/` changes across updates, and a `project-context.md` override in your own repo keeps applying.

---

## Legal & attribution

morgan is an independent, fan-made homage. It is **not affiliated with, authorised, sponsored, or endorsed by Rockstar Games or Take-Two Interactive.** *Red Dead Redemption* and its characters are their property; the persona and character names are used as a writing device, not as a claim on the marks. All instructional content in the plugin is original — no game dialogue, art, or assets are included. The plugin's code and text are MIT-licensed (see [LICENSE](./LICENSE)); that licence covers this project's own content, not the names it borrows.

---

## More

- **Extending the plugin** (new command / agent / reference) → [DEVELOP.md](./DEVELOP.md)
- **Working inside this repo** → [CLAUDE.md](./CLAUDE.md)
- **Hacking on it locally** → `claude plugin marketplace add /absolute/path/to/morgan` then `claude plugin install morgan@morgan`; edits in `plugin/` take effect on the next invocation
- **License** → MIT, see [LICENSE](./LICENSE)

---

<div align="center">

```
*  *  *
```

*Not a hired gun. Not a yes-man. An engineer with a code.*

</div>
