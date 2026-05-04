# Project context

The swap point. Empty in the plugin — filled in by the consuming repo.

---

## Why this file exists

Every codebase has its own conventions, governing rules, and gotchas. Some are documented in `CLAUDE.md`. Some are lore. Some are scattered across READMEs, ADRs, and Slack threads.

This file is where the consuming repo concentrates that context for Arthur. Everything else in the skill is general-purpose; this is the local rulebook.

---

## How to use it (consumers)

There are two patterns:

### 1. Override at the project level

Inside the consuming repo, create:

```
.claude/skills/morgan/references/project-context.md
```

Claude Code's skill loader prefers project-level files over plugin-level. Your project version overrides this stub.

Put in there whatever Arthur should always know about this codebase:
- Governing contract — link to `CLAUDE.md` or the relevant rules.
- Architecture in one paragraph.
- Naming conventions.
- Patterns to follow / patterns to avoid.
- Domain entities and their lifecycle.
- Hidden constraints (deploy windows, license-sensitive code, etc.).
- "When you change X, also check Y."

### 2. Reference an existing file

If the project already has the canonical doc (`CLAUDE.md`, `ARCHITECTURE.md`, etc.), the project-level `project-context.md` can be a thin pointer:

```markdown
Governing contract: read `/CLAUDE.md` at the repo root.
Architecture: read `/docs/architecture.md`.
```

Don't duplicate. Point.

---

## What goes in here, what doesn't

**In:**
- Project-specific rules Arthur must respect.
- Pointers to the canonical docs.
- Domain context that isn't obvious from the code.
- Active constraints (e.g., "we're frozen on Next.js 16 for now").

**Not in:**
- General engineering principles — they're in `foundations.md`, `process.md`, etc.
- Code patterns — the codebase itself is the source of truth; reference it, don't re-document it.
- Stale information — if the project's rules change, update this file.

---

## When the consuming repo hasn't written one

You're in a project where the override doesn't exist. That's fine — Arthur falls back to general principles. Two things to do:

1. **Ask the user** for any project-specific rules he should know about for the current work.
2. **Suggest creating the override** if the work is non-trivial. Pay it once, save context every session.

---

## Conflicts with the rest of the skill

If `project-context.md` contradicts something in `foundations`, `process`, etc. — the project-level rule wins. The general references are defaults; the project-level file is the local law.

The reverse is also true: if `project-context.md` is silent on something, the general references apply.

---

## Anti-patterns

- **Cargo-culted from another project.** Each repo has its own context. Don't copy-paste.
- **Treating it as a journal.** It's a launchpad, not a history book.
- **Letting it go stale.** If the project's stack or conventions change, the file changes too.
- **Putting general principles in here.** They belong in the universal references.
- **Putting code in here.** Reference patterns; don't recreate them.
