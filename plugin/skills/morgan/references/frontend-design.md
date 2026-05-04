# Frontend design

Intentionality, not intensity.

Loaded when the task involves UI, CSS, visual design, or building user interfaces. Triggered during `/scope` (design direction), `/pull` (building), `/clean` (verification), and `/qa`.

---

## Quick reference

| Domain | Critical numbers |
|---|---|
| **Contrast** | 4.5:1 text, 3:1 large text/UI (WCAG AA) |
| **Touch targets** | 44×44px minimum |
| **Spacing scale** | 4, 8, 12, 16, 24, 32, 48, 64, 96px |
| **Animation** | 100–150ms feedback, 200–300ms state, 300–500ms layout |
| **Typography** | 5 sizes, 1.25–1.5 scale ratio, 65ch measure |
| **Performance** | LCP < 2.5s, INP < 200ms, CLS < 0.1 |
| **Perception** | 80ms instant threshold |

---

## Why this matters

Design is engineering for human perception. The same discipline that makes code reliable makes interfaces usable — systems thinking, precise constraints, measurable outcomes. Most frontend bugs aren't code bugs; they're understanding bugs. The developer didn't grasp how humans see, read, touch, and wait.

Every design decision traces back to biological and cognitive constraints. OKLCH exists because human vision isn't linear. The 4pt spacing scale exists because 8pt can't express 12px. The 80ms animation threshold exists because that's how fast brains synchronize perception. These aren't preferences — they're physics.

**Strategic priorities (in order):**
1. **Hierarchy clarity** — Can users identify what matters in under 2 seconds?
2. **Accessibility compliance** — WCAG AA is the floor, not the ceiling.
3. **Performance budget** — Fast interfaces feel more polished than slow beautiful ones.
4. **Design system coherence** — Consistency reduces decision fatigue and maintenance cost.
5. **Edge case resilience** — Production designs handle long text, errors, and i18n.

---

## Design direction

Every interface needs an aesthetic direction with intentionality. Before touching code:

- **Purpose:** What problem does this solve? Who uses it? When and why?
- **Tone:** Pick a direction — brutally minimal, maximalist, retro-futuristic, organic, luxury, playful, editorial, brutalist, art deco, soft pastel, industrial.
- **Differentiation:** What makes this unforgettable? The one thing users remember?
- **Constraints:** Technical requirements, performance budgets, accessibility standards.

Bold maximalism and refined minimalism both work. Chaos without strategy is just loud. Minimalism without thought is just empty. Every choice — color, size, space, motion — should have a reason that traces back to helping the user.

---

## The AI slop test

**The test:** if someone saw this interface and immediately said "AI made this," the design has failed. A distinctive interface should make someone ask "how was this made?" not "which AI made this?"

### Color tells
- Purple-to-blue gradients on dark backgrounds.
- Cyan-on-dark with neon accents.
- Gradient text for "impact" — especially on metrics or headings.
- Dark mode with glowing accents as default (requires no design decisions).
- Gray text on colored backgrounds.

### Typography tells
- Generic fonts: Inter, Roboto, Arial, Open Sans, system defaults everywhere.
- Monospace as lazy shorthand for "technical / developer" vibes.
- Large icons with rounded corners above every heading.

### Layout tells
- Hero metric layout: big number, small label, supporting stats, gradient accent.
- Identical card grids: same-sized cards with icon + heading + text, repeated endlessly.
- Everything wrapped in cards. Nested cards inside cards.
- Everything centered.
- Same spacing everywhere — no rhythm, no hierarchy.

### Effect tells
- Glassmorphism everywhere: blur effects, glass cards, glow borders.
- Rounded elements with thick colored border on one side.
- Sparklines as decoration (tiny charts conveying nothing).
- Rounded rectangles with generic drop shadows.
- Modals as default pattern.

### Interaction tells
- Every button primary (hierarchy requires variation).
- Bounce or elastic easing (dated and tacky).
- Redundant information — headers restating content.

---

## Typography

Typography is the first system you establish. Poor type hierarchy creates confusion in every feature you ship.

### Vertical rhythm

Line-height should be the base unit for ALL vertical spacing. If body text has `line-height: 1.5` on `16px` type (= 24px), all spacing should be multiples of 24px. Text and space share a mathematical foundation. Breaks in rhythm feel jarring even when users can't articulate why.

### Modular scale

Too many similar sizes (14px, 15px, 16px, 18px) create muddy hierarchy. Use 5 sizes with clear contrast.

| Role | Size | Use |
|---|---|---|
| xs | 0.75rem | Captions, legal |
| sm | 0.875rem | Secondary UI, metadata |
| base | 1rem | Body text |
| lg | 1.25–1.5rem | Subheadings, lead |
| xl+ | 2–4rem | Headlines, hero |

Popular ratios: 1.25 (major third), 1.333 (perfect fourth), 1.5 (perfect fifth). Pick one, commit.

### Readability and measure

Use `ch` units for measure: `max-width: 65ch` for optimal readability (45–75 characters per line). Line-height scales inversely with line length — narrow columns need tighter leading (1.4), wide columns need more (1.7). Increase line-height by 0.05–0.1 for light text on dark backgrounds — perceived weight is lighter, needs more breathing room.

### Font selection

**Avoid invisible defaults:** Inter, Roboto, Open Sans, Lato, Montserrat — everywhere and generic.

**Better alternatives:**
- Instead of Inter → Instrument Sans, Plus Jakarta Sans, Outfit.
- Instead of Roboto → Onest, Figtree, Urbanist.
- Instead of Open Sans → Source Sans 3, Nunito Sans, DM Sans.
- For editorial / premium → Fraunces, Newsreader, Lora.

**System fonts are underrated.** `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui` loads instantly, looks native, is highly readable. Consider for apps where performance > personality.

### Font pairing

Often you don't need a second font. One family in multiple weights creates cleaner hierarchy than two competing typefaces. Only pair when you need genuine contrast (display headlines + body serif).

When pairing, contrast on multiple axes: serif + sans (structure), geometric + humanist (personality), condensed + wide (proportion). Never pair similar-but-not-identical fonts — creates tension without hierarchy.

### Web font loading

Layout shift destroys perceived quality. Fix it:

```css
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
  font-display: swap;
}

/* Match fallback metrics to minimize shift */
@font-face {
  font-family: 'CustomFont-Fallback';
  src: local('Arial');
  size-adjust: 105%;
  ascent-override: 90%;
  descent-override: 20%;
  line-gap-override: 10%;
}

body {
  font-family: 'CustomFont', 'CustomFont-Fallback', sans-serif;
}
```

### Fluid type

Use `clamp(min, preferred, max)` for responsive sizing. Middle value (e.g., `5vw + 1rem`) controls scaling rate — higher vw = faster scaling. Add rem offset so it doesn't collapse to 0 on small screens.

**When NOT to use:** button text, labels, UI elements (should be consistent), very short text, precise breakpoint control.

### OpenType features

```css
.data-table { font-variant-numeric: tabular-nums; }  /* Align numbers */
.recipe-amount { font-variant-numeric: diagonal-fractions; }
abbr { font-variant-caps: all-small-caps; }
code { font-variant-ligatures: none; }
body { font-kerning: normal; }
```

### Typography accessibility

- **Never disable zoom.** `user-scalable=no` breaks accessibility.
- **Use rem/em for font sizes.** Respects user browser settings. Never `px` for body text.
- **Minimum 16px body text.** Smaller strains eyes and fails WCAG on mobile.
- **Touch targets.** Text links need padding or line-height creating 44px+ tap targets.

---

## Color and contrast

Color is perception, not decoration. Poor color choices create accessibility failures and maintenance debt.

### Why OKLCH, not HSL

Human vision isn't linear. HSL's 50% lightness in yellow looks bright while 50% in blue looks dark. OKLCH is perceptually uniform — equal lightness steps look equal across all hues.

```css
/* OKLCH: lightness (0–100%), chroma (0–0.4+), hue (0–360) */
--color-primary: oklch(60% 0.15 250);       /* Blue */
--color-primary-light: oklch(85% 0.08 250); /* Lighter — reduce chroma */
--color-primary-dark: oklch(35% 0.12 250);  /* Darker */
```

**Key rule:** as lightness approaches extremes (white/black), reduce chroma. High chroma at 85% lightness looks garish — needs ~0.08 chroma, not the 0.15 of base.

### Tinted neutrals

Pure gray is dead. Add a subtle brand hue to all neutrals:

```css
/* Dead grays (no personality) */
--gray-100: oklch(95% 0 0);

/* Warm-tinted (hint of warmth) */
--gray-100: oklch(95% 0.01 60);
--gray-900: oklch(15% 0.01 60);

/* Cool-tinted (hint of blue) */
--gray-100: oklch(95% 0.01 250);
--gray-900: oklch(15% 0.01 250);
```

Chroma is tiny (0.01) but perceptible. Creates subconscious cohesion between brand and UI. **Never use pure black (`#000`) or pure white (`#fff`).** They don't exist in nature.

### Palette structure

| Role | Purpose | Scale |
|---|---|---|
| **Primary** | Brand, CTAs, key actions | 1 color, 3–5 shades |
| **Neutral** | Text, backgrounds, borders | 9–11 shade scale (tinted) |
| **Semantic** | Success, error, warning, info | 4 colors, 2–3 shades each |
| **Surface** | Cards, modals, overlays | 2–3 elevation levels |

Skip secondary/tertiary unless genuinely needed. Most apps work with one accent color. More creates decision fatigue.

### The 60-30-10 rule

Visual weight, not pixel count:
- **60%** — neutral backgrounds, white space, base surfaces.
- **30%** — secondary colors — text, borders, inactive states.
- **10%** — accent — CTAs, highlights, focus states.

Overusing accent kills its power. Accent works because it's rare.

### Contrast requirements (WCAG)

| Content type | AA minimum | AAA target |
|---|---|---|
| Body text | 4.5:1 | 7:1 |
| Large text (18px+, or 14px bold) | 3:1 | 4.5:1 |
| UI components, icons | 3:1 | 4.5:1 |

**Production gotchas:**
- Placeholder text needs 4.5:1 — that light gray placeholder fails WCAG.
- Gray text on colored backgrounds looks washed out — use a darker shade of the background color.
- Red/green for status: 8% of men can't distinguish — pair with icons or labels.
- Blue on red vibrates visually.
- Yellow on white almost always fails.
- Thin light text on images has unpredictable contrast.

### Dark mode is not inverted

| Light mode | Dark mode |
|---|---|
| Shadows for depth | Lighter surfaces for depth (no shadows) |
| Dark text on light | Light text on dark (reduce font weight) |
| Vibrant accents | Desaturate accents slightly |
| White backgrounds | Never pure black — `oklch(12–18%)` |

```css
:root[data-theme="dark"] {
  --surface-1: oklch(15% 0.01 250);
  --surface-2: oklch(20% 0.01 250);  /* "Higher" = lighter */
  --surface-3: oklch(25% 0.01 250);
  --body-weight: 350;  /* Reduce from 400 */
}
```

### Token architecture

Two layers: **primitive tokens** (`--blue-500`) and **semantic tokens** (`--color-primary: var(--blue-500)`). For dark mode, only redefine the semantic layer. Primitives stay constant.

### Alpha is a design smell

Heavy use of transparency usually means an incomplete palette. Creates unpredictable contrast, performance overhead, and inconsistency. Define explicit overlay colors for each context. Exception: focus rings and interactive states where see-through is needed.

---

## Spatial design and layout

Spacing creates hierarchy and rhythm. Arbitrary values create visual noise.

### 4pt base, not 8pt

8pt is too coarse — you need 12px constantly (between 8 and 16). Use 4pt for granularity.

**Scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96px.

Name semantically (`--space-sm`, `--space-lg`), not by value (`--spacing-8`). Use `gap` instead of margins — eliminates margin collapse and cleanup hacks.

### The squint test

Blur your eyes or screenshot and blur. Can you still identify:
1. The most important element?
2. The second most important?
3. Clear groupings?

If everything looks the same weight blurred, hierarchy has failed.

### Hierarchy through multiple dimensions

Don't rely on size alone. Combine 2–3.

| Tool | Strong | Weak |
|---|---|---|
| **Size** | 3:1+ ratio | <2:1 ratio |
| **Weight** | Bold vs Regular | Medium vs Regular |
| **Color** | High contrast | Similar tones |
| **Position** | Top/left (primary) | Bottom/right |
| **Space** | Surrounded by whitespace | Crowded |

A heading that's larger, bolder, AND has more space above uses 3 dimensions — unmistakable.

### Cards are not required

Cards are overused. Spacing and alignment create visual grouping naturally. Use cards only when content is truly distinct and actionable, items need visual comparison in a grid, or content needs clear interaction boundaries. **Never nest cards inside cards** — use spacing, typography, subtle dividers for internal hierarchy.

### Grid systems

Self-adjusting grid (no breakpoints needed):

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-lg);
}
```

Columns are minimum 280px, as many as fit, leftovers stretch. For complex layouts, use named grid areas (`grid-template-areas`) and redefine at breakpoints.

### Container queries

Viewport queries are for page layouts. **Container queries are for components:**

```css
.card-container { container-type: inline-size; }

@container (min-width: 400px) {
  .card { grid-template-columns: 120px 1fr; }
}
```

Card in narrow sidebar stays compact, same card in main content expands — automatically.

### Optical adjustments

- **Text alignment.** Text at `margin-left: 0` looks indented due to letterform whitespace. Use a small negative margin (`-0.05em`) to optically align.
- **Icon centering.** Geometrically centered icons often look off-center. Play icons shift right; arrows shift toward their direction.

### Touch targets vs visual size

Buttons can look small but need 44px minimum touch targets. Use pseudo-elements:

```css
.icon-button {
  width: 24px; height: 24px;
  position: relative;
}

.icon-button::before {
  content: '';
  position: absolute;
  inset: -10px;  /* Expand tap target to 44px */
}
```

### Depth and elevation

Create semantic z-index scales (dropdown → sticky → modal-backdrop → modal → toast → tooltip) instead of arbitrary numbers. For shadows, create a consistent elevation scale (sm → md → lg → xl). **Shadows should be subtle** — if you can clearly see it, it's too strong.

---

## Interaction design

### The eight interactive states

Every interactive element needs all eight.

| State | When | Treatment |
|---|---|---|
| **Default** | At rest | Base styling |
| **Hover** | Pointer over (not touch) | Subtle lift, color shift |
| **Focus** | Keyboard / programmatic | Visible ring |
| **Active** | Being pressed | Pressed in, darker |
| **Disabled** | Not interactive | Reduced opacity, no pointer |
| **Loading** | Processing | Spinner, skeleton |
| **Error** | Invalid | Red border, icon, message |
| **Success** | Completed | Green check, confirmation |

**The common miss:** designing hover without focus, or vice versa. They're different. Keyboard users never see hover states.

### Focus rings

Never `outline: none` without a replacement. Use `:focus-visible`:

```css
button:focus { outline: none; }
button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

Requirements: high contrast (3:1 minimum), 2–3px thick, offset from element, consistent across all interactive elements.

### Form design

- **Placeholders aren't labels.** They disappear on input. Always use a visible `<label>`.
- **Validate on blur**, not every keystroke (exception: password strength).
- Place errors **below** fields with `aria-describedby` connecting them.

### Loading states

**Optimistic updates.** Show success immediately; rollback on failure. Use for low-stakes actions (likes, follows), not payments or destructive actions.

**Skeleton screens > spinners** — they preview content shape and feel faster.

### Modals: use native dialog

```javascript
const dialog = document.querySelector('dialog');
dialog.showModal();  // Focus trap, Escape closes
```

Or `inert` on background content when modal is open.

### Popover API

For tooltips, dropdowns, non-modal overlays:

```html
<button popovertarget="menu">Open menu</button>
<div id="menu" popover>
  <button>Option 1</button>
</div>
```

Benefits: light-dismiss, proper stacking, no z-index wars, accessible by default.

### Destructive actions: undo > confirm

Undo is better than confirmation dialogs — users click through confirmations mindlessly. Remove from UI immediately, show undo toast, actually delete after toast expires. Use confirmation only for truly irreversible, high-cost, or batch operations.

### Keyboard navigation

**Roving tabindex** for component groups (tabs, menus, radio groups):

```html
<div role="tablist">
  <button role="tab" tabindex="0">Tab 1</button>
  <button role="tab" tabindex="-1">Tab 2</button>
</div>
```

Arrow keys move within. Tab moves to the next component. Provide skip links (`<a href="#main-content">Skip to main content</a>`) — hide off-screen, show on focus.

### Gesture discoverability

Swipe-to-delete is invisible. Hint: partially reveal (button peeking), onboarding (coach marks), always provide visible fallback (menu with "Delete"). Don't rely on gestures as the only way.

---

## Motion design

Motion is perception engineering. It communicates state, provides feedback, and creates perceived performance.

### Duration: the 100/300/500 rule

| Duration | Use | Examples |
|---|---|---|
| 100–150ms | Instant feedback | Button press, toggle, color change |
| 200–300ms | State changes | Menu open, tooltip, hover |
| 300–500ms | Layout changes | Accordion, modal, drawer |
| 500–800ms | Entrances | Page load, hero reveals |

Exit animations are faster than entrances — use ~75% of enter duration.

### Easing: natural deceleration

Don't use `ease`. Real objects decelerate smoothly via friction:

```css
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);    /* Smooth, refined */
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);   /* Snappier */
--ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);    /* Confident */
```

Use ease-out for entrances, ease-in for exits, ease-in-out for toggles.

**Never bounce or elastic** — trendy in 2015, tacky now. Real objects don't bounce when they stop. Overshoot draws attention to the animation itself rather than the content.

### Only animate transform and opacity

Everything else causes layout recalculation. For height animations (accordions), use `grid-template-rows: 0fr → 1fr` instead of animating `height`.

### Staggered animations

Use CSS custom properties: `animation-delay: calc(var(--i, 0) * 50ms)` with `style="--i: 0"` on each item. Cap total stagger time — 10 items at 50ms = 500ms. For many items, reduce per-item delay or cap staggered count.

### Reduced motion (not optional)

Vestibular disorders affect ~35% of adults over 40.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Preserve functional animations (progress bars, spinners, focus indicators) — just without spatial movement.

### Perceived performance

**Nobody cares how fast your site is — just how fast it feels.**

**The 80ms threshold:** brains buffer sensory input for ~80ms. Anything under feels instant. Target for micro-interactions.

**Strategies:**
- **Preemptive start.** Begin transitions while loading (skeleton UI, iOS app zoom).
- **Early completion.** Show content progressively — don't wait for everything.
- **Optimistic UI.** Update immediately, sync later.

**Easing affects perceived duration.** Ease-in (accelerating toward completion) makes tasks feel shorter — peak-end effect weights final moments.

**Caution:** too-fast responses decrease perceived value. Users distrust instant results for complex operations. Sometimes brief delay signals "real work." Example: a search that returns in 10ms feels broken; 200–400ms feels like it actually searched. A payment processing screen that resolves instantly feels insecure; 1–2 seconds with progress feels trustworthy.

Don't use `will-change` preemptively — only when animation is imminent (`:hover`, `.animating`). Use Intersection Observer for scroll-triggered animations; unobserve after animating once.

---

## Responsive design

### Mobile-first

Start with base styles for mobile; use `min-width` queries to layer complexity. Desktop-first (`max-width`) means mobile loads unnecessary styles first.

### Breakpoints: content-driven

Don't chase device sizes — let content tell you where to break. Start narrow, stretch until design breaks, add breakpoint there. Three usually suffice (640, 768, 1024px). Use `clamp()` for fluid values without breakpoints.

### Detect input method, not just screen size

Screen size doesn't tell you input method:

```css
@media (pointer: fine) {
  .button { padding: 8px 16px; }
}

@media (pointer: coarse) {
  .button { padding: 12px 20px; }  /* Larger touch target */
}

@media (hover: hover) {
  .card:hover { transform: translateY(-2px); }
}

@media (hover: none) {
  .card { /* Use :active instead */ }
}
```

**Critical:** don't rely on hover for functionality. Touch users can't hover.

### Safe areas

Modern phones have notches, rounded corners, home indicators:

```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.footer {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
```

Enable: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.

### Responsive images

```html
<img
  src="hero-800.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1200.jpg 1200w"
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Hero image"
>
```

Use `<picture>` for art direction (different crops/compositions):

```html
<picture>
  <source media="(min-width: 768px)" srcset="wide.jpg">
  <source media="(max-width: 767px)" srcset="tall.jpg">
  <img src="fallback.jpg" alt="...">
</picture>
```

### Testing: don't trust DevTools alone

DevTools misses actual touch interactions, real CPU/memory constraints, network latency, font rendering differences, browser chrome. Test on at least one real iPhone, one real Android, tablet if relevant. Cheap Android phones reveal performance issues simulators hide.

---

## UX writing

### Button labels

Never use "OK", "Submit", or "Yes/No". Use specific verb + object.

| Bad | Good | Why |
|---|---|---|
| OK | Save changes | Says what happens |
| Submit | Create account | Outcome-focused |
| Yes | Delete message | Confirms action |
| Cancel | Keep editing | Clarifies what "cancel" means |

For destructive actions, name the destruction: "Delete" not "Remove" (delete is permanent). "Delete 5 items" not "Delete selected" (show count).

### Error messages: the formula

Every error answers: (1) what happened? (2) why? (3) how to fix?

| Situation | Template |
|---|---|
| Format error | "[Field] needs to be [format]. Example: [example]" |
| Missing required | "Please enter [what's missing]" |
| Permission denied | "You don't have access to [thing]. [Alternative]" |
| Network error | "We couldn't reach [thing]. Check connection and [action]" |
| Server error | "Something went wrong on our end. We're looking into it. [Alternative]" |

Don't blame the user: "Please enter a date in MM/DD/YYYY format" not "You entered an invalid date."

### Empty states

Empty states are onboarding moments: (1) acknowledge, (2) explain value, (3) provide action.

"No projects yet. Create your first one to get started." Not "No items."

### Voice vs tone

**Voice** is brand personality — consistent everywhere. **Tone** adapts.

| Moment | Tone |
|---|---|
| Success | Celebratory, brief: "Done. Changes are live." |
| Error | Empathetic, helpful: "That didn't work. Here's what to try…" |
| Loading | Reassuring: "Saving your work…" |
| Destructive | Serious, clear: "Delete this project? Can't be undone." |

Never use humor for errors — users are already frustrated.

### Writing for accessibility

- **Link text** must stand alone: "View pricing plans" not "Click here."
- **Alt text** describes information: "Revenue increased 40% in Q4" not "Chart." `alt=""` for decorative.
- **Icon buttons** need `aria-label`.

### Writing for translation

| Language | Expansion |
|---|---|
| German | +30% |
| French | +20% |
| Finnish | +30–40% |
| Chinese | −30% (fewer chars, same width) |

Keep numbers separate ("New messages: 3" not "You have 3 new messages"). Use full sentences as single strings. Avoid abbreviations. Give translators context.

### Terminology

Pick one term, stick with it. Delete / Remove / Trash → Delete. Settings / Preferences / Options → Settings. Sign in / Log in / Enter → Sign in. Build a glossary and enforce it. Variety creates confusion.

### Avoid redundant copy

If the heading explains it, the intro is redundant. If the button is clear, don't explain it again. Say it once, say it well.

---

## Production hardening

Designs that only work with perfect data aren't production-ready.

### Text overflow

```css
/* Single line with ellipsis */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Multi-line clamp (vendor prefix required — no unprefixed version) */
.line-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Prevent flex/grid overflow */
.flex-item, .grid-item {
  min-width: 0;  /* Allow shrinking below content size */
}
```

### Internationalization

**Text expansion:** add 30–40% space budget. Use flexbox/grid that adapts. Never fixed widths on text containers.

**RTL support** (logical properties):

```css
margin-inline-start: 1rem;  /* Not margin-left */
padding-inline: 1rem;       /* Not padding-left/right */
```

**Date/time formatting:**

```javascript
new Intl.DateTimeFormat('en-US').format(date);  // 1/15/2024
new Intl.DateTimeFormat('de-DE').format(date);  // 15.1.2024
```

**Pluralization:** never `${count} item${count !== 1 ? 's' : ''}`. Use an i18n library that handles complex plural rules.

### Error handling

**API errors by status:** 400 → validation errors. 401 → redirect to login. 403 → permission error. 404 → not-found state. 429 → rate-limit message. 500 → generic error with support.

**Form validation:** inline errors near fields, clear messages, suggest corrections, preserve input on error.

### Progressive disclosure

Use `<details>/<summary>` for expandable content — native, accessible, no JS:

```html
<details>
  <summary>Advanced options</summary>
  <div class="details-content">
    <!-- Content revealed on click -->
  </div>
</details>
```

### Responsive tables

For tables that overflow on mobile, use `data-label` to create stacked card layouts:

```html
<td data-label="Price">$29.99</td>
```

```css
@media (max-width: 640px) {
  td::before {
    content: attr(data-label);
    font-weight: bold;
    display: block;
  }
}
```

### Edge cases

Test with: very long text (100+ chars), very short text (empty, single char), special characters (emoji, RTL, accents), large datasets (1000+ items), network failures, concurrent operations, no permissions. Don't load all 10,000 items at once — paginate or virtualize.

### Performance targets

**Core Web Vitals:** LCP < 2.5s, FID/INP < 100ms / < 200ms, CLS < 0.1.

**Images:** WebP/AVIF, proper sizing, lazy loading below fold, srcset, 80–85% quality compression.

**JavaScript:** code split, tree shake, dynamic imports for heavy components, remove unused dependencies.

**Fonts:** `font-display: swap`, subset, preload critical, limit weights loaded.

**Layout:** never read then write layout properties in loops (causes thrashing). Batch reads, then writes. Use `content-visibility: auto` for long lists.

---

## Second-order effects

Every design decision has consequences beyond the immediate.

### Hierarchy decisions
- **First order:** This element is larger.
- **Second order:** Everything else feels less important.
- **Third order:** Users miss secondary actions.
- **Mitigation:** Limit primary elements to 1 per view. 2–3 hierarchy levels max.

### Color palette expansion
- **First order:** More variety.
- **Second order:** More design decisions per feature.
- **Third order:** Inconsistent application, maintenance burden.
- **Mitigation:** Justify every color. Default to constraining the palette, not expanding it.

### Animation addition
- **First order:** More engaging interactions.
- **Second order:** Performance overhead, motion fatigue.
- **Third order:** Accessibility issues for motion-sensitive users.
- **Mitigation:** Animate with purpose. Always provide reduced-motion alternative.

### Component extraction
- **First order:** Reusable component.
- **Second order:** Maintenance overhead, version management.
- **Third order:** Resistance to changes that break existing uses.
- **Mitigation:** Extract when 3+ uses exist. Don't prematurely extract.

### Dark mode support
- **First order:** Theme toggle users want.
- **Second order:** Double the testing surface, token complexity.
- **Third order:** Inconsistent application across features over time.
- **Mitigation:** Design for dark mode from the start. Semantic tokens. Test both continuously.

---

## Connection map

These principles reinforce each other:

**Human perception** → drives OKLCH adoption, 80ms thresholds, vertical rhythm, squint test.

**Consistency** → generates design tokens, typography systems, spacing scales, terminology rules.

**Progressive disclosure** → connects interaction design, onboarding, responsive adaptation, cognitive load limits.

**Accessibility** → touches every domain: color contrast, focus management, reduced motion, semantic HTML, keyboard navigation.

**Performance** → intersects with motion (transform/opacity only), images (lazy loading, srcset), fonts (loading strategies), bundle size.

OKLCH isn't just about color — it connects to accessibility (predictable contrast), theming (consistent lightness steps), and dark mode (reliable shade generation). The 4pt spacing system connects to typography (12px often needed), responsive design (finer granularity), and vertical rhythm (easier multiples).

---

## Anti-patterns

### Typography
- Overused fonts as lazy choice (Inter, Roboto, Arial, Open Sans).
- Monospace as "developer" aesthetic.
- Too many similar sizes creating muddy hierarchy.
- More than 2–3 font families per project.
- Decorative fonts for body text.
- Gradient text for "impact."

### Color
- AI palette: cyan-on-dark, purple-to-blue gradients, neon accents.
- Gray text on colored backgrounds (use shade of background).
- Pure black (`#000`) or pure white (`#fff`) for large areas.
- Color alone to convey information.
- Heavy alpha/transparency (incomplete palette).
- Inverting light mode for dark mode.

### Layout
- Everything wrapped in cards. Cards inside cards.
- Identical card grids. Hero metric layout template.
- Centering everything. Same spacing everywhere.
- Glassmorphism, glow borders, sparklines as decoration.
- Rounded rectangles with generic drop shadows.

### Interaction
- Every button primary (hierarchy requires variation).
- Removing focus indicators without replacement.
- Placeholders as labels.
- Touch targets < 44×44px.
- Generic error messages.
- Custom controls without ARIA / keyboard.
- Modals as default pattern (prefer inline solutions).

### Motion
- Animating layout properties (width, height, padding).
- Bounce or elastic easing.
- Animation without purpose. Animating everything.
- Ignoring `prefers-reduced-motion`.
- Durations > 500ms for UI feedback.

---

## Quality checks

### Before building
- [ ] Design direction established (purpose, tone, differentiation).
- [ ] Typography system defined (5 sizes, scale ratio, font selection).
- [ ] Color palette complete (primary, neutral, semantic, surface).
- [ ] Spacing scale established (4pt base).
- [ ] Token architecture defined (primitive + semantic layers).
- [ ] Production hardening strategy planned.

### Before shipping
- [ ] **AI Slop Test** — Does this look AI-generated? Check all tells.
- [ ] Contrast ratios meet WCAG AA (4.5:1 text, 3:1 large text/UI).
- [ ] Focus indicators visible for keyboard (3:1 contrast, 2–3px thick).
- [ ] Touch targets 44×44px minimum on touch devices.
- [ ] All 8 interactive states designed (default through success).
- [ ] Reduced motion alternative provided.
- [ ] Responsive at all breakpoints (mobile, tablet, desktop).
- [ ] Text overflow handled (truncation, wrapping, line-clamp).
- [ ] Empty states helpful and actionable.
- [ ] Error states helpful with recovery path.
- [ ] Loading states clear with progress indication.
- [ ] i18n ready: expansion budget, RTL support, proper formatting.
- [ ] Keyboard navigation works (tab order, no traps, skip links).
- [ ] Screen reader support (ARIA labels, semantic HTML, alt text).
- [ ] Performance passing (CLS < 0.1, LCP < 2.5s, no layout thrashing).
- [ ] Real device testing (not just DevTools).
