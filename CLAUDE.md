# CLAUDE.md — morgan plugin development

You're working on the **plugin source** of `morgan`. This is the tool itself — not a project consuming the tool. Stay aware of the difference: changes here ship to anyone who installs the plugin.

---

## What's here

```
.
├── .claude-plugin/marketplace.json     # marketplace manifest
├── plugin/                             # plugin source
│   ├── .claude-plugin/plugin.json      # plugin manifest
│   ├── commands/                       # 10 slash commands (.md per command)
│   ├── agents/                         # 7 sub-agents (.md per agent)
│   └── skills/morgan/
│       ├── SKILL.md                    # master persona + principles
│       ├── references/                 # 12 reference docs
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

- Version `0.1.9` — instructional weight polish from a parity audit: SKILL.md restores 5 calibration losses (persona affect, scope-flexes punchline, pre-commit hooks framing, Lenny role spec, consult imperatives); `pull.md` regains TDD closing step + atomic-commit example + structured `Brief each sub-agent with:` block; `track.md` Investigation forces minimum three parallel sub-agents.
- Version `0.1.8` — explicit cycle handoffs: every command ends in a `## Next` block; SKILL.md gets a `Sequence the cycle` table and a tightened command imperative; `track.md` gains a diagnosis→fix fork before fix verification.
- Version `0.1.7` — align .camp artefact filenames with command names; add explicit Workflows section to README.
- 10 commands, 7 agents, 13 references shipped.
- Smoke install probe still TODO from a clean shell.

---

## Next actions for a returning agent

1. Read [DEVELOP.md](./DEVELOP.md) if extending the plugin.
2. Read the relevant slash-command or agent file directly — they're the source of truth for the command's behaviour.
3. Run the originality gate (above) before any commit.
4. Bump versions in both manifests when shipping a meaningful change.
