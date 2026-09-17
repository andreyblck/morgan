# DEVELOP.md — extending the morgan plugin

How the plugin is built, how to add a command or agent or reference, how to test changes locally.

For high-level repo orientation, read [CLAUDE.md](./CLAUDE.md). For user-facing install and usage, read [README.md](./README.md).

---

## How Claude Code loads this plugin

When a user runs `claude /plugin install morgan@morgan`, Claude Code:

1. Reads the **marketplace manifest** at `.claude-plugin/marketplace.json` to find the plugin entry and its `source` directory (here: `./plugin`).
2. Reads the **plugin manifest** at `plugin/.claude-plugin/plugin.json` for plugin metadata.
3. Registers everything under `plugin/commands/`, `plugin/agents/`, and `plugin/skills/` so Claude Code knows about them.

When the user types `/<command-name>`, Claude Code resolves `plugin/commands/<command-name>.md`. The frontmatter sets the command's metadata; the body is the prompt that runs.

When a command says "Load the `morgan` skill," Claude Code loads `plugin/skills/morgan/SKILL.md`. The references a command needs are named in its own Load line, not in the skill — 0.1.17 measured that an instruction in `SKILL.md` and one in the command file compete, and the skill's won every time, so the command's own method never arrived. The Load line's shape is load-bearing: numbered steps, full paths, a reason the process can't run without them, and an explicit note that earlier reads in the session don't count.

When a command or skill says to delegate to "Charles" or another agent, Claude Code uses `plugin/agents/<name>.md` to spin up a sub-agent with that persona, those tools, and that body as system prompt.

That's the whole machinery. Three file types, one manifest pair.

---

## Anatomy of a command file

```markdown
---
name: <command-name>
description: <one-line description shown in autocomplete>
argument-hint: "<placeholder for $ARGUMENTS>"
---

# /<command-name>

<One-line tagline or intent statement.>

---

## Intent

<Paragraph on what this command is for.>

---

## Load skill

Before you do anything else, in this order:

1. Load the `morgan` skill.
2. Read `references/<topic>.md`. That's the method this command runs on — you can't execute the process below without it. Read it now even if you loaded the skill or other references earlier in this session: each command runs on its own, and what's already in context is not this.

Don't start the work until it's read.

---

## Start

$ARGUMENTS

If no <input> was specified, STOP and ask: "<question>"

---

## The process

<Numbered or sectioned steps. Be procedural. Tell the agent what to do, not what to think about.>

---

## Output

<What the command produces.>

---

## Persist

<Where output is saved, by default `.camp/<artefact>.md`.>

---

## Anti-patterns

<Bullets — common mistakes to avoid.>
```

**Conventions:**

- `name` is the slash-command name. Lowercase, no slash, no spaces.
- `description` shows up in `/help` and autocomplete. One sentence.
- `argument-hint` documents what `$ARGUMENTS` represents.
- The body is markdown. The first H1 is `# /<name>` (with leading slash). Section headings use `##`.
- `$ARGUMENTS` is substituted at runtime with whatever the user typed after the slash command.
- Use backticks around other slash commands when referenced (e.g., `` `/case` ``).

---

## Anatomy of an agent file

```markdown
---
name: <Agent>
description: "<One-line use-case description.>"
tools: <comma-separated tool list>
model: sonnet
---

You're <Agent>. You work with Arthur.

<Two paragraphs of persona — who they are, what they do, why Arthur calls on them.>

---

## Rules

- <Bullet rule>
- ...

---

## How to <verb>

<Methodology — numbered steps, one per phase or category.>

---

## Output structure

<Specific format Arthur expects back. Findings, classifications, evidence, gaps.>
```

**Conventions:**

- `name` is the agent's display name. Capitalized.
- `description` is the trigger doc — when should Arthur reach for this agent?
- `tools` is a comma-separated list of Claude Code tools. Keep minimal — only what the agent actually needs.
- `model` defaults to `sonnet`. Use `opus` only when the agent's lens benefits from deeper reasoning *and* the work is uncommon enough to justify cost.
- Body is system prompt. Speak in second person to the agent ("You're Charles...").

**Tool list reference:**

| Tool | Use |
|---|---|
| `Read` | Read files |
| `Glob` | File pattern matching |
| `Grep` | Content search |
| `Bash` | Shell commands |
| `WebSearch` | Web search |
| `WebFetch` | Fetch web URLs |
| `mcp__playwright__browser_*` | Playwright browser automation (Tilly only) |

---

## Anatomy of a reference file

```markdown
# <Topic>

<One-line summary, naming what loads it: "Loaded by `/<command>`.">

---

## <Section>

<Content — direct, imperative, organized by sub-section.>

---

## Anti-patterns

<Bullets.>
```

**Conventions:**

- Filename is the lowercase topic with hyphens: `frontend-design.md`, not `FrontendDesign.md`.
- First H1 matches the topic in title case.
- The first line under H1 says when this reference is loaded.
- Content is concrete. Examples are real. Bad/good tables for guidance with ambiguity.
- End with anti-patterns.

---

## Adding a new command

1. **Pick a name.** Verb-first, lowercase. Run the collision check (see CLAUDE.md). Don't shadow Claude Code built-ins.
2. **Decide the workflow.** What's the input? What does the command produce? Where is output persisted? Which references should it load?
3. **Write `plugin/commands/<name>.md`.** Use the anatomy above as the template.
4. **Update `plugin/skills/morgan/SKILL.md`** — **two tables, not one.** Add a row to the Commands (or Branches) table *and* a row to `Sequence the cycle` saying where the command hands off. Miss the second and the agent finishes the command without knowing what follows. Don't add the command's reference to the References table there — that table is only for references answering to no single command.
5. **Update `plugin/skills/morgan/templates/intro.md`** — the branches list, and the counts-and-version line at the top. That line is invisible to every check in this repo: it sat two releases stale before anyone noticed, because nothing compares it to the manifests.
6. **Run `./scripts/check-load-lines.sh`** and lower its baseline if the new command's references are cited in its body.
7. **Update `README.md`** — `commands-N` badge, the two "N branches" counts in prose, the branches table, the ASCII workflow diagram, the `.camp/` artefact paragraph if the command leaves one, and the MCP bullet if it talks to a tracker. Six or seven separate edits; "update the README" has been one vague clause covering all of them, which is how they get missed.
8. **Smoke test:** in a sandbox dir, install the local marketplace, run the new command, verify it produces what you expected — and grep the transcript to confirm the Load line actually fired. `scripts/harness.sh` does this headlessly against a fixture and tells you whether the references were read or refused.
9. **Bump version** in both manifests.

---

## Adding a new agent

1. **Pick a name.** A first name (Charles, Sadie, Hosea, etc.) — keeps the crew identifiable.
2. **Decide the lens.** Don't duplicate an existing agent's role. The crew is small for a reason.
3. **Decide the tools.** Minimal set. Don't grant Bash to an agent that doesn't need to run scripts.
4. **Write `plugin/agents/<name>.md`.** Use the anatomy above. Include rules, methodology, output structure.
5. **Update `SKILL.md`:** add to the agent table; mention them in the relevant brief sections.
6. **Update `README.md`** agent table.
7. **Smoke test:** call the agent from a relevant command and verify the output structure.
8. **Bump version.**

---

## Adding or refining a reference

1. **Pick a topic.** Discipline-shaped (planning, debugging, etc.) or domain-shaped (frontend-design, project-context).
2. **Decide which command loads it.** There is no always-loaded tier — it was removed in 0.1.17 because it crowded out the reference the running command actually needed. A reference earns its place in one command's Load line, or it's reachable on demand via `SKILL.md`'s table. Naming it in a Load line means every invocation of that command pays for it.
3. **Write `plugin/skills/morgan/references/<topic>.md`** using the anatomy above.
4. **Update `SKILL.md`** only if the reference answers to no single command — those are the ones listed in its References table.
5. **Update commands** that should now load this reference.
6. **Smoke test:** invoke a command that should load it, verify it loads.

---

## Project-context override

Reference `project-context.md` is the swap point. The plugin ships an empty stub. Consuming repos override at:

```
<consumer-repo>/.claude/skills/morgan/references/project-context.md
```

Project-level files override plugin-level. This lets each repo carry its own conventions without forking the plugin.

If you ever change `project-context.md` in the plugin, keep it minimal — it's a stub describing the override mechanism, not actual content.

---

## Versioning

Semver. The version lives in two places — keep them in sync:

- `.claude-plugin/marketplace.json` → `plugins[0].version`
- `plugin/.claude-plugin/plugin.json` → `version`

| Change | Bump |
|---|---|
| Adding a command, agent, or reference | minor (`0.X.0`) |
| Refining content of existing files | patch (`0.X.Y`) |
| Removing or renaming a command, breaking change | major (`X.0.0`) |
| Tweaking install instructions or metadata | patch |

For pre-1.0 releases (`0.X.Y`), treat any breaking change as a minor bump and any addition as a patch — there's no API contract yet.

---

## Style & quality

- Markdown formatting: prettier (`.prettierrc` in repo root).
- Markdown linting: markdownlint (`.markdownlint.json`).
- Run before push: `prettier --write '**/*.md'` and `markdownlint '**/*.md' --ignore node_modules`.
- Resolve every command reference before push — a rename leaves live pointers behind, and a dead one only shows up when a user follows it. From the repo root:

  ```bash
  grep -rhoE '`/[a-z][a-z-]+`' plugin --include='*.md' | tr -d '`/' | sort -u \
    | while read c; do [ "$c" = morgan ] || [ -f "plugin/commands/$c.md" ] || echo "DANGLING: /$c"; done
  ```

  `/morgan` is the skill, not a command — hence the exclusion. Check the root docs by eye; they name Claude Code built-ins the plugin doesn't own.
- Keep load lines tied to demonstrated use — run `./scripts/check-load-lines.sh` before push. That check resolves reference pointers the same way the one above resolves command pointers, and adds a ratchet.

  A reference named in a `## Load skill` line is a whole-file read paid on every invocation of that command. Load lines only ever grow, because nothing stops a reference being added "for completeness" to a command that never acts on it — that's how `/pivot` came to load four references and name one. The rule: **a reference belongs in a load line only if the command body names the decision it governs.**

  That rule can't be checked mechanically, so the script checks a weaker proxy — does the body cite the reference *as* a reference, in backticks or by path, outside the Load section — and gates on the count not rising. A command can act on a reference without naming it (`/track` loads `tracing` and its whole procedure *is* the tracing method), so an uncited pair is a question, not a verdict. Lower the baseline when a trim lands; never raise it to make a push go through.
- Originality gate: see CLAUDE.md.

---

## Testing changes locally

Plugin management uses the `claude plugin` CLI (no slash):

```bash
# Validate manifests:
claude plugin validate /path/to/morgan
claude plugin validate /path/to/morgan/plugin

# Reinstall to pick up structural changes (renames, manifest edits):
claude plugin uninstall morgan@morgan
claude plugin install morgan@morgan

# Content edits (command bodies, agent prompts, references) are picked up
# on the next slash-command invocation — no reinstall needed.
```

For end-to-end testing, use a dedicated sandbox dir (not the morgan repo itself, not your daily project). Run a full cycle: `/morgan:scope → /morgan:case → /morgan:pull → /morgan:clean → /morgan:camp`. Verify artefacts land in `.camp/` of the sandbox. Restart the Claude Code session if commands don't appear in autocomplete after install.

---

## Anti-patterns when extending

- **Adding a command for every concept.** Concepts go in references. Commands are workflows.
- **Granting tools an agent doesn't need.** Tilly doesn't need WebFetch. Charles doesn't need Playwright.
- **Reusing names from inspiration sources.** The originality gate exists to catch this.
- **Cosplay-heavy prose.** Voice rule above. RDR2 flavour is seasoning, not main course.
- **Skipping the smoke test.** A command that compiles isn't a command that works.
- **Forgetting the version bump.** Consumers won't see new behaviour without it.
