---
name: qa
description: Browser/visual smoke check before declaring UI work done.
argument-hint: "[URL or local dev server, plus what to check]"
---

# /qa

Eyes on it before you walk away.

---

## Intent

Type-checking and tests verify code correctness. They don't verify whether the page actually looks right, the click actually works, the keyboard actually navigates. `/qa` runs the browser smoke before UI work is called done. If anything fails, back to `/pull`. Don't run `/clean` on UI work that hasn't been QA'd.

---

## Load skill

Load the `morgan` skill first. Then read `references/frontend-design.md` and `references/verification.md`.

---

## Start

$ARGUMENTS

If no URL or check was specified, STOP and ask: "What URL is the work running on, and what scenarios should I exercise? Golden path, plus any edge cases the formula calls out."

---

## Pre-flight

### 1. Confirm the dev server is running

If the work runs locally, confirm the dev server is up before opening the browser. Don't stare at a connection refused page and call it broken UI.

### 2. Confirm what to check

Get from the user (or the formula's success criteria):
- Golden path — what's the primary flow this UI is supposed to support?
- Edge cases — empty state, error state, loading state, very long content, very short content.
- Breakpoints — at minimum, smallest target viewport and typical desktop.
- Accessibility lane — does the work make claims about keyboard or screen reader?
- **Figma reference (optional)** — if a Figma URL is in `$ARGUMENTS`, in the formula, or referenced in `CLAUDE.md`, **and a Figma MCP server is connected** (tools matching `mcp__figma-remote-mcp__*`), fetch the design context for the relevant frame via `get_design_context` (and `get_screenshot` when comparing). Add a smoke check: rendered UI matches Figma intent on layout, spacing, color, typography, interactive states. If no Figma reference or no MCP, skip — functional smoke is sufficient.

---

## The process

### 1. Delegate to Tilly

`/qa` is mostly Tilly's lane. Brief her:

- **URL or path** to the running app.
- **Scenarios** to exercise — golden path, edge cases.
- **Breakpoints** to check.
- **Pass/fail criteria** — concrete, observable.

Tilly drives the browser through the Playwright MCP tools, captures snapshots, reports console messages, and classifies findings.

### 2. The smoke checklist

Tilly's default smoke (or yours, if running directly):

- [ ] Page loads without errors.
- [ ] Console has no errors — warnings noted, not failed.
- [ ] Golden path executes end-to-end.
- [ ] Each edge case renders the expected state.
- [ ] Layout holds at the smallest target breakpoint.
- [ ] Layout holds at the typical desktop breakpoint.
- [ ] Tab key reaches every interactive element in a sensible order.
- [ ] Focus is visible on every focused element.
- [ ] Loading and error states actually render (don't just exist in the code).
- [ ] No regressions in adjacent UI that the work might have affected.

### 3. Capture evidence

For each finding:
- Screenshot or snapshot.
- Console message text.
- Reproduction steps (URL, viewport, action).

### 4. Classify findings

- **Critical** — blocking. Page doesn't load, golden path broken, console error in normal flow, layout collapse.
- **Major** — fix before declaring done. Edge case broken, missing focus state, accessibility gap.
- **Minor** — note and defer. Cosmetic alignment, non-blocking warning.

### 5. Decide

- Zero Critical, zero Major → QA passes. Move to `/clean`.
- Any Critical → back to `/pull`. Don't paper over it.
- Major → fix or get explicit user approval to defer.

---

## Output

A QA report:

```markdown
# QA: [feature name]

## Setup
- URL: [where it ran]
- Browser/viewport tested: [list]

## Findings
- **Critical:** [list with evidence] — or "none"
- **Major:** [list with evidence] — or "none"
- **Minor:** [list]

## Verdict
- [ ] QA passes — proceed to `/clean`
- [x] Back to `/pull` — Critical/Major listed above
```

---

## Persist

If findings are non-empty, save to `.camp/qa-<feature>.md`. If clean and trivial, a chat note is fine. Use judgment.

---

## Anti-patterns

- Calling UI work done without a browser actually opened.
- Trusting "looks fine in dev" without testing the smallest breakpoint.
- Skipping keyboard checks because "most users use a mouse."
- Filtering findings — Major becomes Minor by squinting.
- Running `/clean` on UI work before `/qa` passes.
- Doing QA on a stale build — confirm what you're testing matches what just got built.
- Hand-waving accessibility checks.

---

## Next

Findings? `/pull` the fixes, then `/qa` again. Clean? `/clean` to verify formula compliance, then `/camp`.
