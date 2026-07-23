# CLAUDE.md — morgan plugin development

You're working on the **plugin source** of `morgan`. This is the tool itself — not a project consuming the tool. Stay aware of the difference: changes here ship to anyone who installs the plugin.

---

## What's here

```
.
├── .claude-plugin/marketplace.json     # marketplace manifest
├── plugin/                             # plugin source
│   ├── .claude-plugin/plugin.json      # plugin manifest
│   ├── commands/                       # 11 slash commands (.md per command)
│   ├── agents/                         # 7 sub-agents (.md per agent)
│   └── skills/morgan/
│       ├── SKILL.md                    # master persona + principles
│       ├── references/                 # 13 reference docs
│       └── templates/intro.md          # first-load greeting
├── .markdownlint.json
├── .prettierrc
├── CLAUDE.md                           # this file
├── DEVELOP.md                          # how to add commands / agents / refs
├── LICENSE                             # MIT
└── README.md                           # for plugin users
```

For the deeper "how to extend" guide, read [DEVELOP.md](./DEVELOP.md).
For the user-facing install + usage, read [README.md](./README.md).

---

## Local dev loop

Plugin management uses the `claude plugin` **CLI** from your shell — not `/plugin` slash-commands inside a Claude session.

```bash
# Add the local marketplace once.
claude plugin marketplace add /path/to/morgan
claude plugin install morgan@morgan

# Iterate: edit any file under plugin/, the next slash-command invocation picks it up.
# No publish, no re-install.

# Validate manifests after structural changes:
claude plugin validate /path/to/morgan
claude plugin validate /path/to/morgan/plugin
```

After installing, restart any active Claude Code session for the commands to appear in autocomplete.

When you've made meaningful changes, bump versions in **both** manifests:

- `.claude-plugin/marketplace.json` → `plugins[0].version`
- `plugin/.claude-plugin/plugin.json` → `version`

Semver. They must match.

---

## Voice rule (non-negotiable)

The plugin's voice is **Arthur Morgan — disciplined, plainspoken, weary but principled**. RDR2 flavour appears only in:

- Section headers, sparingly.
- One or two sayings per file at most.
- Agent name-drops.
- *Never* in instruction text.

90% of prose is direct imperative engineering English — same density as a good engineering doc, different colour. Cosplay is forbidden — cowboy slang, "ain't" everywhere, theatre. Read any new file aloud: if it sounds like a person, ship it; if it sounds like a costume, rewrite.

---

## Originality gate

The plugin was built by referencing engineering-discipline patterns from elsewhere — but **the plugin's content must be 100% original**. Inspirations are not invocable text.

Maintain a local-only list of inspiration-source terms (persona names, framing words, signature phrases). Before every push, grep `plugin/**` and `README.md` against that list. Zero hits, or fix the leak.

The list lives in your private notes — not in this repo. Naming the terms here would defeat the gate's purpose.

---

## File conventions

- All command, agent, reference, and template files are **markdown with YAML frontmatter** (where applicable). Plain markdown — no JSX, no MDX.
- Frontmatter must be valid YAML. Validate by eye or with `yq`.
- All filenames are **lowercase, hyphen-separated** (`mary-beth.md`, not `MaryBeth.md`).
- Commands and references use **kebab-case slugs** matching the slash command or trigger.
- Agents use the **lowercase agent name** as the filename (`charles.md`, `dutch.md`).

---

## What lives where

| Layer | Decides... | Edit when... |
|---|---|---|
| `commands/<name>.md` | What `/<name>` does, step by step | The command's process changes |
| `agents/<name>.md` | An agent's persona, methodology, output | Adjusting an agent's role or tooling |
| `skills/morgan/SKILL.md` | The master persona and command/agent index | Adding/removing a command or agent — update tables here |
| `skills/morgan/references/<name>.md` | A discipline (planning, execution, etc.) | Refining the methodology behind a command |
| `skills/morgan/templates/intro.md` | First-load greeting | Tweaking the persona's introduction |
| `.claude-plugin/marketplace.json` | Marketplace metadata | Version bump, description change |
| `plugin/.claude-plugin/plugin.json` | Plugin metadata | Version bump |
| `README.md` | Install + usage for plugin users | Distribution or command surface changes |
| `CLAUDE.md` | Plugin-development context (this file) | Layout / dev-loop changes |
| `DEVELOP.md` | How to add a command/agent/ref | Pattern conventions change |

---

## Slash command name policy

Avoid names that collide with Claude Code built-ins or common plugin commands. Built-ins to avoid: `/plan`, `/clear`, `/help`, `/init`, `/memory`, `/config`, `/model`, `/cost`, `/agents`, `/plugin`, `/vim`. When introducing a new command, run a quick collision check before locking in the name.

---

## Status

- Version `0.1.14` — **work items cut across the layers, not along one**, resolving a contradiction that had the wrong side winning. `case.md:158` and `breakdown.md:172` listed "Think in layers" as sequencing principle number one, which licenses items shaped `add the types` / `build the schema` / `wire the UI` — each ≤8 points, each with testable criteria and a named test approach, so each passed all four of `case.md`'s readiness checks while leaving nothing working until the last one landed. `breakdown.md` gains a shape rule (an item runs one narrow path through the system and works when it's finished; layers order the build *inside* a slice and are not how you cut items), splitting guidance across the path rather than down through it, and a quality check that makes the author name what a caller can do that they couldn't before. `case.md` carries the rule into work-item creation with a required **What works when it's done** field, and its sequencing principles are reordered so Value early is first and layers drop to fifth, scoped to ordering within a slice. Environment stays an explicit exception — tooling comes once, before the first slice. Subtasks keep their licence to leave nothing user-visible; what's forbidden is a plan made entirely of them. **Measured, not assumed:** a 12-run controlled comparison of the old text against the new, same feature both arms, blind scoring — layer-shaped items fell from 37 of 81 to 0 of 54, and the first item after which anything works end to end moved from a mean of 5.2 to exactly 1 in six runs out of six. The same experiment retired one line of 0.1.13: the twelve-line minimisation block in `track.md` changed nothing (six of six runs minimised without it) and is cut to a sentence; and it located where the expected-value condition actually bites — with a spec present both arms scored identically, with no spec the new text tripled independently derived values, so `building.md` gains an explicit no-source-of-truth branch.
- Version `0.1.13` — **evidence over assertion**, applying the 0.1.11 operation to the two disciplines that still ran on adjectives. A test was "meaningful" and a bug was "reproduced" because the agent said so; both now carry conditions the agent can fail its own work against. `building.md` gains "What a test has to prove" — four conditions (seen failing for the expected reason / expected value sourced outside the code under test / asserts through the caller's door / substitutes only past a boundary you don't own), with the snapshot-and-golden-file carve-out stated so a briefed reviewer can't raise false findings against approved output; `pull.md` and `clean.md` point at it instead of restating "meaningful", and `/clean`'s brief is scoped to the three conditions visible in code (fail-first belongs to `/pull`). `track.md` reorders the diagnosis so the reproduction is a **command you have run** built *before* sub-agent investigation — previously theories were formed at step 2 and the repro checked at step 3 — followed by a new minimisation step, a failure-rate branch for intermittent bugs (which condition 1 of the certainty gate could not otherwise satisfy), and 3–5 falsifiable candidates named before any is tested. All of it sits **upstream** of the 0.1.11 gate, which is untouched. Fix verification gains the seam rule: no seam that runs the real path is a finding about the code, not a gap in effort. Landing is deliberate — the substance is in triggered-load references, so the always-loaded budget pays two clauses total. Also: two dead pointers fixed (`scope.md` → `/audible`, `DEVELOP.md` → `/morgan:map`), the `audible` vocabulary finished off in three files, and a pre-push check added to `DEVELOP.md` that resolves every command reference so the next rename can't repeat it. Sourced from a survey of an external skills collection — 82 candidates gap-audited against the plugin and adversarially attacked on redundancy, philosophy fit and sprawl cost; the surviving mechanisms were re-expressed in morgan's own words, and the review pass that followed killed four coinages and a formulation that quietly weakened the certainty gate.
- Version `0.1.12` — in-flight working log + `/break`, closing the handoff gap where the *live* trail of a job in motion — what was tried, what it produced, what's ruled out, what's still open — had no home and died with the session (it never reaches a commit). `handing-off.md` defines the format (six sections, generalised in-house from `incident.md` Timeline+Hypotheses and `hosea.md` Dead-ends/Gaps) and splits *settled history → commits* from *in-flight state → `.camp/`*, so CLAUDE.md stays a launchpad. `track.md` writes the ledger live, before the cause is Confirmed; `camp.md` seals non-debug in-flight work to `.camp/trail-<slug>.md`. New `break.md` (`/break <task>`) resumes a parked job by scanning `.camp/`; `SKILL.md` Recovery scans `.camp/` for open trails at session start. Mechanism is **decoupled from CLAUDE.md by design** — `.camp/` is the self-describing index (`/break` and recovery find logs there), so it works on projects that don't keep a CLAUDE.md and never bloats one that does. Diagnosed and built through the full cycle (`/track` 4-agent investigation → gap Confirmed, adversary survived → `/scope` → `/case` → `/pull`).
- Version `0.1.11` — debugging gains a **certainty gate**, closing the "stops at the first plausible cause" gap. A diagnosis is "done" when the cause is *proven*, not when a 5-Whys list bottoms out. `track.md` adds a four-condition gate (reproduces — run the experiment, don't imagine it / accounts for everything / competitors ruled out / Confirmed confidence) before the fix, names Hosea for cold trails, requires a competing theory, reframes the "timebox → stop" anti-pattern into "escalate as a working theory, never ship a guess," and carries a proportionality note (same bar every bug, effort scales — no skip-loophole). `tracing.md` root-cause analysis grows prove/compete/account/confidence steps and the bug-fix recap points at the full gate; `SKILL.md` "When debugging" + "Understand before fixing" carry the gate; `hosea.md` rule + verification step 7 hardened to operational (reproduce/account/kill-competitors before Confirmed). The gate also threads the `/aftermath` path so it can't be contradicted downstream: `incident.md` 5 Whys and `aftermath.md` Root-cause/Five-Whys gain the proof requirement, and the `.camp/lessons.md` entry gets a **Confidence** field so recovery never re-surfaces a theory as fact. Fix was adversarially red-teamed via a verification workflow (28 candidate findings → 9 confirmed, all applied; gate's four-ANDed-conditions structure held against gameability/over-rotation attacks).
- Version `0.1.10` — `/scope` and `/case` Output sections gain a one-line **Basis** footer requirement: short note on what the formula or breakdown leans on and why this approach. Additive only; existing flow untouched.
- Version `0.1.9` — instructional weight polish from a parity audit: SKILL.md restores 5 calibration losses (persona affect, scope-flexes punchline, pre-commit hooks framing, Lenny role spec, consult imperatives); `pull.md` regains TDD closing step + atomic-commit example + structured `Brief each sub-agent with:` block; `track.md` Investigation forces minimum three parallel sub-agents.
- Version `0.1.8` — explicit cycle handoffs: every command ends in a `## Next` block; SKILL.md gets a `Sequence the cycle` table and a tightened command imperative; `track.md` gains a diagnosis→fix fork before fix verification.
- Version `0.1.7` — align .camp artefact filenames with command names; add explicit Workflows section to README.
- 11 commands, 7 agents, 13 references shipped.
- Smoke install probe still TODO from a clean shell.

---

## Next actions for a returning agent

1. Read [DEVELOP.md](./DEVELOP.md) if extending the plugin.
2. Read the relevant slash-command or agent file directly — they're the source of truth for the command's behaviour.
3. Run the originality gate (above) before any commit.
4. Bump versions in both manifests when shipping a meaningful change.
