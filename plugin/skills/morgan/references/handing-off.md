# Handing off

Session context for the next agent. Always loaded.

---

## When to trigger

**Trigger handoff when:**
- The session is ending (user says goodbye, wrapping up).
- A major milestone completes (feature done, phase transition).
- A significant decision was made.
- Work is blocked and pausing.
- The user explicitly asks ("handoff", "wrap up", "update context").

**Don't trigger for:**
- Minor progress within a task.
- Quick questions or clarifications.
- No meaningful state change since last handoff.

---

## Persist work products

Conversation context is ephemeral. Formulas, scout findings, decisions, root-cause traces, architecture sketches — they exist only in the current session until saved to disk.

**When significant work completes, act immediately:**
1. Tell the user: "This only exists in conversation. Want me to save it?"
2. Don't wait to be asked. Don't assume they know it's ephemeral.
3. Don't claim work is preserved when it isn't.
4. Don't say "come back to this later" unless it's actually saved somewhere.

**What counts as significant:**
- A completed formula (scope, success criteria, approach).
- Scout findings and recommendations.
- Decisions and their rationale.
- Architecture or design work.
- Root-cause analyses for non-trivial bugs.
- Anything that took substantial effort to produce.

**Where to save:**
- `.camp/` for in-flight work — gitignored, persists across sessions. On the first write in a repo: create the directory, ensure `.gitignore` covers it, and tell the user what `.camp/` is and that they can choose a different location.
- `docs/{topic}/` for permanent work products — committed, shared, and the user decides when and where to graduate things.
- A context log for session history (optional — see below).
- `CLAUDE.md` for current status only — never the work products themselves.

**The rule:** if it would hurt to lose it, offer to save it.

---

## The process

### 1. Assess current state

Quick scan (use sub-agents if needed):
- What is this project?
- What commands are needed to run it?
- What's in progress?
- What just completed?
- What's blocked or waiting?
- What's the logical next step?

### 2. Create or update CLAUDE.md

Single operation. If the file exists, update it. If not, create it.

**Location:** project root `CLAUDE.md`.

### 3. Keep it minimal, stay flexible

CLAUDE.md tells the next agent what to do *now*. Not project history. Not full documentation. Just:

- What this is and how to run it.
- Where we are.
- What to do next.

The user may want more. Keep the data updated as things change — commands, structure, docs, where you are in the process. Adapt to what they need.

---

## CLAUDE.md template

```markdown
# {Project Name}

{One sentence: what this project is.}

## Commands

{Essential commands to work with this project.}

```bash
# Install dependencies
{install command}

# Run development
{dev command}

# Run tests
{test command}

# Build
{build command}
```

## Structure

{Brief overview of key directories/files. 4–8 lines max.}

- `docs/` — {requirements, specs, decisions}
- `src/` — {what's here}
- `tests/` — {what's here}
- ...

## Status

{Current state in 2–4 bullets. What exists, what's in progress.}

- ...
- ...

## Next

{Specific next action. What the next agent should do first.}

## Context

{Optional: 1–3 bullets of important context. Recent decisions, blockers, gotchas.}
```

---

## Context log (optional)

For projects that need session history, maintain a single log file. Prepend new entries at the top — newest first.

**File:** `docs/context.md` or similar.

**Entry format:**

```markdown
## 2026-05-03T18:59:14.629Z

What changed. Decisions made. What's next.
```

Use `node -e "console.log(new Date().toISOString())"` or equivalent for precise timestamps.

**When to use:** multi-session projects, team handoffs, or when "how did we get here?" matters.

CLAUDE.md = current state. Context log = history. Most projects only need CLAUDE.md.

---

## Anti-patterns

- **Too much detail.** This isn't full documentation. The next agent can explore. Focus on what's NOW.
- **Vague next steps.** "Continue working" tells nothing. Be specific.
- **Stale information.** Wrong status is worse than no status.
- **Missing commands.** The agent needs to know how to run the project.
- **Project history in CLAUDE.md.** Don't include what happened. CLAUDE.md is current state + next action. History belongs in commits and docs.
- **Claiming work is preserved.** Saying "no work lost" or "come back to this" when work exists only in conversation. Sessions end. Be honest about persistence.

---

## Verification

Before completing handoff:

- [ ] CLAUDE.md exists at project root.
- [ ] Commands section has working commands.
- [ ] Status reflects actual current state.
- [ ] Next action is specific and actionable.
- [ ] No stale or outdated information.
- [ ] All significant work products saved (or explicitly declined by the user).

The next agent starts cold. Give them exactly what they need to continue.

---

## Context limits

When context is getting full, say so immediately. Don't wait until it's critical. Let the user choose:

- **Complete current task.** If it can finish before limits hit, keep going.
- **Compact.** Fine if the summary stays coherent and the agent doesn't become "two-brained."
- **Fresh handoff.** Better for complex work where nuance matters.

Don't silently degrade. Communicate and let the user choose.

---

## Lessons across sessions

`.camp/lessons.md` is the cross-session memory. Unlike formula / prep / clean reports — which describe one piece of work — lessons accumulate across many.

**Triggered by `/aftermath`.** Postmortems condense into a four-line entry: pattern, root cause, watch-for, action. The full postmortem stays where the user keeps incident docs; lessons.md is just the index of patterns to remember.

**Read by skill recovery.** When a session starts, the morgan skill scans `.camp/lessons.md` and surfaces relevant precedents if the current work matches a pattern. "Last time you saw a 401 on the login route, the cause was the cookie domain — start there before chasing CORS again."

**Format:**

```markdown
## 2026-05-03 — login redirect loop

**Pattern:** auth callback returned 302 chain on iOS Safari
**Root cause:** session cookie SameSite=Strict broke cross-subdomain auth on resume
**Watch for:** mobile auth bug reports mentioning resume / reload / "stuck on /login"
**Action taken:** SameSite=Lax + harden mobile session detection (PR #491)
```

Newest entry first. Three to four lines each. If the file grows past ~30 entries, archive the oldest to `docs/incidents/` (or wherever the project keeps history) and trim `.camp/lessons.md` back. The point is *patterns I should remember*, not *every incident in detail*.
