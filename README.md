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

![Version](https://img.shields.io/badge/version-0.1.11-1f6feb)
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

> **Who's Arthur Morgan?** The protagonist of *Red Dead Redemption 2* (Rockstar Games, 2018). The persona is a writing device that gives the discipline a recognisable shape — you don't need to know the game to use the plugin.

## Quick start

```bash
claude plugin marketplace add andreyblck/morgan
claude plugin install morgan@morgan
```

Restart any active Claude Code session so the commands appear in autocomplete. Then in any project:

```
/morgan:morgan
```

Loads the skill, prints the banner, glances at git state, surfaces patterns from past `/aftermath` runs, proposes a next action.

> Use the `claude plugin` **CLI** from your shell — not the in-session `/plugin` manager.

---

## Commands

You drive morgan with slash commands. A **cycle** of five for normal work, five **branches** for when reality interrupts. The commands route to the agents and references for you — you rarely call those directly.

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

Branches don't replace the cycle — they feed into it:

```
Feature         /scope ─▶ /case ─▶ /pull ─▶ /clean ─▶ /camp
Trivial fix     /track ─▶ /pull ─▶ /clean ─▶ /camp
Bigger fix      /track ─▶ /scope ─▶ /case ─▶ /pull ─▶ /clean ─▶ /camp
Research first  /scout ─▶ /scope ─▶ /case ─▶ /pull ─▶ /clean ─▶ /camp
Plan changed    /pivot ─▶ /case ─▶ /pull ─▶ /clean ─▶ /camp
UI work         /scope ─▶ /case ─▶ /pull ─▶ /qa ─▶ /clean ─▶ /camp
```

## The crew

When the work needs another lens, the commands route to seven specialist sub-agents automatically — you don't usually summon them yourself:

**Charles** (research / review) · **Hosea** (deep debugging) · **Sadie** (security / loose ends) · **Dutch** (strategy / risk) · **Lenny** (architecture) · **Mary-Beth** (product counterweight) · **Tilly** (visual QA via Playwright).

## What it leaves behind

Each command writes to `.camp/` in your repo — gitignored, survives across sessions. `/aftermath` also appends a four-line entry to `.camp/lessons.md`: cross-session memory the skill reads on every session start, surfacing a past pattern when the current work resembles one. Add `.camp/` to your `.gitignore`; when something deserves a permanent home (`docs/`, ADRs, runbooks), you decide where it goes.

## Make it yours

- **Project rules.** Drop your repo's conventions into `<repo>/.claude/skills/morgan/references/project-context.md`. It overrides the plugin's stub and becomes local law; the plugin's general references stay general.
- **MCP, optional.** `/scope` reads Linear tickets, `/track` pulls Sentry telemetry, `/qa` checks against Figma — each fails gracefully and proceeds if the server isn't connected.

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
