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

![Version](https://img.shields.io/badge/version-0.1.9-1f6feb)
![License](https://img.shields.io/badge/license-MIT-blue)
![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-8b5cf6)
![Status](https://img.shields.io/badge/status-alpha-f59e0b)
![Skill](https://img.shields.io/badge/skill-1-22c55e)
![Commands](https://img.shields.io/badge/commands-10-22c55e)
![Agents](https://img.shields.io/badge/agents-7-22c55e)
![References](https://img.shields.io/badge/references-13-22c55e)

</div>

---

## What is morgan

A Claude Code plugin that bolts a **process layer** onto your day-to-day work. It puts an engineer with a code at your shoulder — one who insists you understand the problem before solving it, decompose by what *done* actually means, and tell the truth about where the work stands.

You get a five-step **cycle** for normal work, five **branches** for when reality interrupts (research, debugging, incidents, pivots, UI verification), seven **specialist agents** with distinct roles, and thirteen **reference docs** of distilled engineering practice the skill loads as needed.

The lead persona is **Arthur Morgan** — disciplined, plainspoken, honest about what he sees, won't be pushed past his principles. Says *"I don't know"* before he'll guess.

> **Who's Arthur Morgan?** The protagonist of *Red Dead Redemption 2* (Rockstar Games, 2018). The voice we drew from is his journal: weary professional, plainspoken, principled, honest about mistakes. The persona is a writing device that gives the discipline a recognisable shape — you don't need to know the game to use the plugin.

## Quick start

```bash
claude plugin marketplace add andreyblck/morgan
claude plugin install morgan@morgan
```

Verify:

```bash
claude plugin list
# Expect: morgan@morgan — Status: ✔ enabled
```

Restart any active Claude Code session for the new commands to appear in autocomplete. Then in any project:

```
/morgan:morgan
```

Loads the skill, prints the banner, glances at git state, surfaces relevant patterns from past `/aftermath` runs, proposes a next action.

> Use the `claude plugin` **CLI** from your shell — not `/plugin` slash-commands inside a Claude session. The slash form is the in-session manager UI; arguments don't reach it cleanly.

---

## Table of contents

- [How it works](#how-it-works)
  - [The cycle](#the-cycle)
  - [The branches](#the-branches)
  - [How they chain](#how-they-chain)
- [The crew](#the-crew)
- [The code](#the-code)
- [The bar](#the-bar)
- [Detailed usage](#detailed-usage)
  - [Building a feature](#building-a-feature)
  - [Fixing a bug](#fixing-a-bug)
  - [When the plan changes](#when-the-plan-changes)
  - [After an incident](#after-an-incident)
- [Project-specific overrides](#project-specific-overrides)
- [In-flight artefacts](#in-flight-artefacts)
- [MCP integrations](#mcp-integrations)
- [Plugin layout](#plugin-layout)
- [Local-path install](#local-path-install)
- [Development](#development)
- [License](#license)

---

## How it works

### The cycle

The default flow runs five commands in sequence. Each step seals the work so the next has something solid to build on.

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  /scope  │──▶│  /case   │──▶│  /pull   │──▶│  /clean  │──▶│  /camp   │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
   define        decompose       build         verify        hand off
```

| Command | Output | Purpose |
|---|---|---|
| `/scope` | `.camp/scope.md` | Define the problem — IN/OUT, success criteria, constraints, risks |
| `/case` | `.camp/case.md` | Decompose into work items with exit criteria, sequenced for safety |
| `/pull` | code + commits | Build it — TDD where it makes sense, atomic commits, match patterns |
| `/clean` | `.camp/clean-<scope>.md` | Verify against original intent — not just *tests pass* |
| `/camp` | updated `CLAUDE.md` | Seal the session, hand off to the next agent |

`/scope` produces a sealed scope document. `/case` turns it into a work-item breakdown. `/pull` executes against the breakdown. `/clean` verifies against original intent. `/camp` writes the handoff.

### The branches

When the cycle isn't enough — when something's missing, broken, or changing — reach for these:

| Command | When to reach for it |
|---|---|
| `/scout` | You don't know enough yet — bounded research with a recommendation |
| `/track` | Something's broken and the cause isn't clear — root-cause analysis |
| `/aftermath` | Something already broke — postmortem and prevention |
| `/pivot` | The plan needs to change mid-work — controlled scope change |
| `/qa` | The work touched UI — browser smoke check via Playwright |

Each branch produces its own artefact in `.camp/`. `/aftermath` additionally appends a four-line lesson to `.camp/lessons.md` — that's the cross-session memory, read on every fresh session.

### How they chain

The branches don't replace the cycle — they feed into it:

```
Build a feature       /scope  ─▶ /case ─▶ /pull ─▶ /clean ─▶ /camp
Trivial fix           /track  ─▶ /pull ─▶ /clean ─▶ /camp
Non-trivial fix       /track  ─▶ /scope ─▶ /case ─▶ /pull ─▶ /clean ─▶ /camp
Research first        /scout  ─▶ /scope ─▶ /case ─▶ /pull ─▶ /clean ─▶ /camp
Plan changed          /pivot  ─▶ /case ─▶ /pull ─▶ /clean ─▶ /camp
UI work               /scope  ─▶ /case ─▶ /pull ─▶ /qa ─▶ /clean ─▶ /camp
After an incident     /aftermath ─▶ updates .camp/lessons.md ─▶ next cycle benefits
```

`/track` produces a reproducible diagnosis you then `/scope` into a fix. `/scout` produces decision-grounded options you then `/scope` against. `/pivot` re-seals an existing scope mid-work. `/aftermath` doesn't restart the cycle — it leaves a lesson so the next session recognises the pattern.

---

## The crew

When the work needs another lens, Arthur calls on seven specialists. You usually don't call them directly — the cycle and branch commands route work to them automatically.

| Agent | Role | When |
|---|---|---|
| **Charles** | The scout | Default for research, code review, impact assessment. Reads the land before others walk it. |
| **Sadie** | The eye for trouble | Security review, operational readiness, loose ends. Doesn't miss a threat. |
| **Hosea** | The old detective | Deep debugging, root-cause analysis, git forensics. Methodical. Won't quit until the trail ends. |
| **Dutch** | The strategist | Risk assessment, long-term consequences, second-order effects. Sees moves ahead — but check his work, his plans aren't always right. |
| **Lenny** | The structural eye | System-level architectural review, dependency analysis. Reads code by structure, not by file. |
| **Mary-Beth** | The counterweight | Product thinking, devil's advocate, communication clarity. Pushes back from outside the engineer's view. |
| **Tilly** | The visual QA | Browser smoke, accessibility, design-fidelity. Drives Playwright when UI work needs eyes on it. |

Each agent has a distinct methodology and output format. Charles is the default delegation target for general research. Tilly is invoked exclusively by `/qa`. The others are summoned by Arthur as the work requires.

---

## The code

Arthur works by six rules. They aren't slogans — they're decisions made every single time:

1. **Define the work before doing it.** No code until the problem is stated clearly.
2. **Decompose by exit criteria, not calendar.** *Done* is a set of conditions, not a deadline.
3. **Build to spec.** TDD where it makes sense. Commits at logical boundaries. Match the codebase's patterns.
4. **Verify against intent.** Tests passing isn't the same as *done right*.
5. **Hand off clean.** The next agent starts cold. Give them the launchpad, not the journal.
6. **Tell the truth about where the work stands.** Don't claim work is preserved when it lives only in conversation.

---

## The bar

Arthur's standard for *done* is **walk away clean**. Not 80% done, not "tests pass so probably fine" — clean. No half-jobs, no leftover trouble, no work declared finished that isn't.

Concretely, `/clean` enforces:

- **Zero Critical findings.** Broken behaviour, data risk, security gap, an unmet formula success criterion — any of these blocks the walkaway.
- **Zero Major findings.** Missing error handling, anti-pattern, significant test gap, inconsistency with existing codebase patterns.
- **Every success criterion explicitly verified with evidence.** Not "tests pass." Specific check, specific result, specific file or behaviour cited.
- **Every prep work item built and acceptance-checked.** Anything added beyond the work item without an `/pivot` is scope drift and gets flagged.
- **Code matches existing patterns.** No commented-out blocks, no debug prints, no hardcoded credentials, no test-coverage gaming.

Anything short of that is *not done* — and Arthur will tell you so. Minor findings can be acknowledged and deferred with the user's explicit say-so; Critical and Major cannot.

---

## Detailed usage

### Building a feature

```bash
/morgan:scope <Linear ticket URL or key, or plain text describing the goal>
  → produces .camp/scope.md
  → if Linear MCP is connected and $ARGUMENTS looks like a ticket, fetches it as source-of-truth

/morgan:case
  → produces .camp/case.md (work items with exit criteria, sequenced)

/morgan:pull
  → builds, atomic commits, matches existing patterns

/morgan:qa     # if UI work
  → browser smoke check via Playwright MCP (Tilly drives)
  → if Figma MCP is connected and a Figma URL is provided, includes a "matches Figma intent" check

/morgan:clean
  → verifies the work against the scope and breakdown

/morgan:camp
  → updates CLAUDE.md, persists artefacts, hands off
```

### Fixing a bug

```bash
/morgan:track <symptom>
  → root-cause analysis
  → if Sentry MCP is connected, pulls production telemetry
  → produces .camp/track-<symptom>.md

# Trivial fix — single site, no public contract change.
# Skip /scope and /case, go straight to /morgan:pull → /morgan:clean → /morgan:camp.

/morgan:scope <restatement of the fix>
  → for non-trivial fixes — defines the fix as a sealed scope, not "go fix it"

/morgan:case → /morgan:pull → /morgan:clean → /morgan:camp
  → standard cycle from here
```

### When the plan changes

```bash
/morgan:pivot <what changed and why>
  → re-seals scope, gets explicit approval, resumes
  → produces .camp/pivot-<date>.md (the audit trail)
```

### After an incident

```bash
/morgan:aftermath <incident slug>
  → if active: contain → recover → communicate → fix
  → if post-incident: timeline → root cause → contributing factors → action items
  → produces .camp/aftermath-<slug>.md
  → appends a 4-line entry to .camp/lessons.md
```

The lesson entry surfaces in the next session's `/morgan:morgan` intro when the new work resembles the pattern.

---

## Project-specific overrides

Every codebase has its own conventions. The plugin's `project-context.md` reference is intentionally a stub — override it at the project level by creating:

```
<your-repo>/.claude/skills/morgan/references/project-context.md
```

Put your repo's actual rules and pointers there:

```markdown
Governing contract: read /CLAUDE.md.
Architecture: read /docs/architecture.md.
Naming conventions: <link or short bullets>.
Active constraints: <e.g., frozen on Next.js 16 until April>.
```

The plugin's general references stay general. The project-level file is the local law.

---

## In-flight artefacts

Each command writes to `.camp/` in the consuming repo (gitignored, persists across sessions):

| Command | Artefact | Lifetime |
|---|---|---|
| `/scope` | `.camp/scope.md` | One per cycle (overwritten on next `/scope`) |
| `/case` | `.camp/case.md` | One per cycle |
| `/clean` | `.camp/clean-<scope>.md` | One per `/clean` run, accumulates |
| `/scout` | `.camp/scout-<topic>.md` | One per investigation |
| `/track` | `.camp/track-<symptom>.md` | One per bug |
| `/aftermath` | `.camp/aftermath-<slug>.md` + 4-line entry in `.camp/lessons.md` | Per-incident + accumulating cross-session memory |
| `/pivot` | `.camp/pivot-<date>.md` | One per pivot |

`.camp/lessons.md` is the cross-session memory — patterns from past `/aftermath` runs, four lines per entry. The skill reads it on session start and surfaces relevant precedents when current work resembles a known pattern.

> Add `.camp/` to your repo's `.gitignore`. When something graduates from `.camp/` to a permanent location (`docs/`, ADRs, runbooks), you decide where it goes.

---

## MCP integrations

Optional — graceful-fail if the corresponding MCP server isn't connected:

| Command | MCP server | What it adds |
|---|---|---|
| `/scope` | Linear (`mcp__linear-server__*`) | If `$ARGUMENTS` looks like a Linear URL or ticket key, fetches the ticket and uses its description and acceptance criteria as the scope's source-of-truth |
| `/track` | Sentry (`mcp__sentry__*`) | Queries production for recent issues matching the symptom — grounds diagnosis in real telemetry instead of guesswork |
| `/qa` | Figma (`mcp__figma-remote-mcp__*`) | If a Figma URL is referenced, fetches design context. The smoke check then includes "rendered UI matches Figma intent on layout, spacing, colour, typography, interactive states" |

If an MCP server isn't installed, the command notes the absence once and proceeds without it. Nothing breaks.

---

## Plugin layout

```
morgan/
├── .claude-plugin/marketplace.json   # marketplace metadata
└── plugin/                           # plugin source
    ├── .claude-plugin/plugin.json    # plugin metadata
    ├── commands/                     # 10 slash commands (markdown with frontmatter)
    ├── agents/                       # 7 sub-agents (markdown with frontmatter)
    └── skills/morgan/
        ├── SKILL.md                  # master persona, principles, command index
        ├── references/               # 13 reference docs loaded on demand
        └── templates/intro.md        # first-load greeting
```

---

## Local-path install

When you're hacking on the plugin itself, install from a local path instead of GitHub:

```bash
claude plugin marketplace add /absolute/path/to/morgan
claude plugin install morgan@morgan
```

Live edits in `plugin/` take effect on the next slash-command invocation — no republish, no re-install. To force a refresh after structural changes (renames, manifest edits), bump the version in **both** manifests and run `claude plugin update morgan@morgan`.

---

## Development

For extending the plugin (adding a new command, agent, or reference), see [DEVELOP.md](./DEVELOP.md). It covers the source format, conventions, voice rule, and the quality gate to run before pushing.

For maintaining and iterating, see [CLAUDE.md](./CLAUDE.md). It's the launchpad for any agent dropped into the plugin's own repo.

---

## License

MIT — see [LICENSE](./LICENSE).

---

<div align="center">

```
*  *  *
```

*Not a hired gun. Not a yes-man. An engineer with a code.*

</div>
