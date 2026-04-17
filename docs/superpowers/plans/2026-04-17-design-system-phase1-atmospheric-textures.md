# Design System Phase 1 — Atmospheric Textures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CRT scanlines and SVG `feTurbulence` film grain to HustleClub's global CSS in three escalating intensity tiers — body, cards, and hero sections.

**Architecture:** Pure CSS additions to `src/globals.css`. A single SVG data URI noise filter is stored as a CSS custom property `--grain-filter` and reused across all tiers. Body gets fixed full-viewport overlays via `body::before` / `body::after`. Cards and surfaces get per-element `::after` overlays. Hero sections opt in via a `.hero-texture` utility class. One extra word (`isolate`) added to `<body>` className in `src/app/layout.tsx` for Safari compositing correctness.

**Tech Stack:** Next.js 15 App Router, CSS (no new libraries), Tailwind CSS (existing, not used for these additions — plain CSS only)

---

## File Map

| File | Change |
|------|--------|
| `src/globals.css` | Add `--grain-filter` custom property, `body::before`, `body::after`, `.app-card::after`, `.app-surface::after`, `.hero-texture`, reduced-motion reset block |
| `src/app/layout.tsx` | Add `isolate` to `<body>` className |

---

## Task 1: SVG Filter Definition + Tier 1 Body Overlays

**Files:**
- Modify: `src/globals.css` — append after the existing `:root` block

### What you're building

Define the single SVG grain filter as a CSS custom property, then apply two fixed full-viewport overlays to the `<body>`: a scanline layer (`::before`) and a grain layer (`::after`). These sit at `z-index: 1` and `z-index: 2` — well below the navbar (`z-50`) and any modals.

- [ ] **Step 1: Verify the current end of `:root` in `globals.css`**

Open `src/globals.css`. Find the `:root` block (lines 8–42 approximately). Confirm it ends with:
```css
  --shadow-raised: 0 8px 40px rgba(0,0,0,.8);
}
```
The `--grain-filter` custom property will be added inside this same `:root` block.

- [ ] **Step 2: Add `--grain-filter` to `:root`**

Inside the `:root` block, after `--shadow-raised`, add:

```css
  --grain-filter: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='hc-grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3C/svg%3E#hc-grain");
```

This stores the full SVG data URI (URL-encoded) as a reusable variable. The `feTurbulence` produces fractal noise; the `feColorMatrix saturate=0` strips all colour, leaving pure luminance grain.

- [ ] **Step 3: Append the Tier 1 body overlay block to `globals.css`**

At the very end of `src/globals.css`, add:

```css
/* ═══════════════════════════════════════════
   ATMOSPHERIC TEXTURES — TIER 1 (BODY)
   Fixed full-viewport scanlines + grain.
   z-index 1-2 keeps both layers below all UI.
═══════════════════════════════════════════ */

/* Scanlines */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.022) 2px,
    rgba(0, 0, 0, 0.022) 3px
  );
}

/* Grain */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background-image: var(--grain-filter);
  background-repeat: repeat;
  opacity: 0.028;
}
```

- [ ] **Step 4: Start the dev server and visually verify**

```bash
cd /Users/snehakaushik/hustleclubv1
npm run dev
```

Open `http://localhost:3000` in a browser. You should see:
- A very subtle horizontal line pattern across the entire page background (scanlines — barely perceptible at 0.022 opacity)
- A faint noise texture layered on top of the background grid (grain at 0.028 opacity)
- No visible effect on text, buttons, or cards (the overlays are behind all UI)
- Clicking anywhere works normally (pointer-events: none confirmed)

If the grain is invisible, that's correct — it's intentionally subtle at Tier 1. The effect accumulates with cards and hero sections in Tasks 2 and 3.

- [ ] **Step 5: Confirm `body::before` / `body::after` don't conflict with navbar**

Scroll down and back up. Confirm the sticky navbar (`position: sticky; z-index: 50`) renders above the overlays. The scanlines and grain should appear to scroll with the page background, not float above UI elements.

- [ ] **Step 6: Commit**

```bash
cd /Users/snehakaushik/hustleclubv1
git add src/globals.css
git commit -m "feat(design): add SVG grain filter + Tier 1 body atmospheric overlays"
```

---

## Task 2: Tier 2 Card and Surface Overlays

**Files:**
- Modify: `src/globals.css` — append after Task 1 block

### What you're building

Add a stronger grain + scanline overlay to `.app-card` and `.app-surface` elements. These use `position: absolute; inset: 0` within the `position: relative` card, so the grain is clipped to each card's bounds. Grain opacity is `0.045` and scanline opacity is `0.03` — noticeably denser than the body tier.

- [ ] **Step 1: Confirm `.app-card` and `.app-surface` are `position: relative` in `globals.css`**

Search `src/globals.css` for `.app-card` and `.app-surface`. Both must have `position: relative` (or no `position` override that would break an absolutely-positioned child). Current definitions:

```css
.app-surface {
  background: var(--surface);
  border: 1px solid var(--line);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.app-card {
  background: var(--surface-strong);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
}
```

Neither has `position: relative` explicitly set. The `::after` `position: absolute` child will establish its own stacking context and position relative to the nearest positioned ancestor. Most cards already have a positioned parent, but to be safe, add `position: relative` to both in this task.

- [ ] **Step 2: Append Tier 2 block to `globals.css`**

After the Tier 1 block from Task 1, append:

```css
/* ═══════════════════════════════════════════
   ATMOSPHERIC TEXTURES — TIER 2 (CARDS)
   Denser grain + scanlines on card surfaces.
   Combined in one background-image declaration.
═══════════════════════════════════════════ */

.app-card,
.app-surface {
  position: relative;
}

.app-card::after,
.app-surface::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: inherit;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 1px,
      rgba(0, 0, 0, 0.03) 1px,
      rgba(0, 0, 0, 0.03) 2px
    ),
    var(--grain-filter);
  background-repeat: repeat;
  opacity: 0.045;
}
```

Note: both scanlines and grain share the same opacity (0.045) because they are combined in one `background-image` on a single `::after`. This is correct per spec — the scanline rgba values (0.03 channel) and the grain (0.045 element opacity) compound to give Tier 2's characteristic density.

- [ ] **Step 3: Visually verify card grain**

With `npm run dev` still running, open `http://localhost:3000`. Cards on the homepage (channel cards, role row cards) should show a subtly denser texture than the page background. The difference is most visible on the `.app-card` channel cards in the "Three Ways to Get Paid" section.

Check:
- Card content (text, links) is still fully readable
- Clicking card links still works (pointer-events: none on overlay)
- Card hover lifts still animate correctly (the `::after` has no transition, so it doesn't interfere)

- [ ] **Step 4: Check cards with children that use `::after` themselves**

Any card that already uses `::after` on a child element (not the card itself) is unaffected. The rule targets `.app-card::after` directly — child elements' own pseudo-elements are untouched. Confirm by inspecting the "Roles" section card on the homepage — the `RoleRow` components inside the card should render normally.

- [ ] **Step 5: Commit**

```bash
cd /Users/snehakaushik/hustleclubv1
git add src/globals.css
git commit -m "feat(design): add Tier 2 card/surface grain overlay"
```

---

## Task 3: Tier 3 Hero Texture + Reduced-Motion Reset + Layout Fix

**Files:**
- Modify: `src/globals.css` — append Tier 3 block and reduced-motion block
- Modify: `src/app/layout.tsx` — add `isolate` to `<body>` className

### What you're building

Three things in one task (all small):

1. **`.hero-texture`** — opt-in utility class. Apply it to any `<section>` or `<div>` to get the maximum intensity grain + scanlines (opacity 0.07, scanline alpha 0.05). Uses `z-index: -1` within an `isolation: isolate` stacking context so the overlay sits behind the section's content.

2. **Reduced-motion reset** — `@media (prefers-reduced-motion: reduce)` zeroes all overlay opacities. Required for accessibility.

3. **`layout.tsx` `isolate` fix** — adds the Tailwind `isolate` class to `<body>`. This tells Safari to create a new stacking context for the body, ensuring the fixed `body::before` / `body::after` overlays composite correctly and don't bleed through `position: sticky` elements on older Safari versions.

- [ ] **Step 1: Append Tier 3 + reduced-motion blocks to `globals.css`**

After the Tier 2 block, append:

```css
/* ═══════════════════════════════════════════
   ATMOSPHERIC TEXTURES — TIER 3 (HERO)
   Max intensity. Opt in with .hero-texture.
   Uses isolation:isolate so overlay is behind
   the section's own content.
═══════════════════════════════════════════ */

.hero-texture {
  position: relative;
  isolation: isolate;
}

.hero-texture::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 1px,
      rgba(0, 0, 0, 0.05) 1px,
      rgba(0, 0, 0, 0.05) 2px
    ),
    var(--grain-filter);
  background-repeat: repeat;
  opacity: 0.07;
}

/* ═══════════════════════════════════════════
   ATMOSPHERIC TEXTURES — ACCESSIBILITY
   Respect prefers-reduced-motion. All overlays
   are decorative — zero opacity removes them.
═══════════════════════════════════════════ */

@media (prefers-reduced-motion: reduce) {
  body::before,
  body::after,
  .app-card::after,
  .app-surface::after,
  .hero-texture::after {
    opacity: 0 !important;
  }
}
```

- [ ] **Step 2: Add `isolate` to `<body>` in `layout.tsx`**

Open `src/app/layout.tsx`. Find the `<body>` tag (currently line 68):

```tsx
<body className="font-[var(--font-body)] antialiased">
```

Change it to:

```tsx
<body className="font-[var(--font-body)] antialiased isolate">
```

`isolate` is a Tailwind utility that sets `isolation: isolate`. This is a one-word change.

- [ ] **Step 3: Test `.hero-texture` opt-in on the homepage hero**

Open `src/app/page.tsx`. Find the hero `<section>` (the first section, around line 9). Add `hero-texture` to its className or inline style. Since this page uses inline styles, add a wrapping className:

```tsx
<section className="hero-texture" style={{
  padding: "5rem 0 4.5rem",
  borderBottom: "1px solid var(--line)",
}}>
```

Save and check `http://localhost:3000`. The hero section should visibly show stronger grain and scanlines compared to the rest of the page. This is a test-only change — **revert it after confirming it works:**

```tsx
<section style={{
  padding: "5rem 0 4.5rem",
  borderBottom: "1px solid var(--line)",
}}>
```

- [ ] **Step 4: Test reduced-motion in browser**

In Chrome DevTools: open the Rendering panel (`Cmd+Shift+P` → "Show Rendering") → check "Emulate CSS media feature prefers-reduced-motion: reduce". The page should look identical to a plain dark background with no visible grain or scanlines. Uncheck to restore.

- [ ] **Step 5: Run TypeScript check**

```bash
cd /Users/snehakaushik/hustleclubv1
npx tsc --noEmit
```

Expected output:
```
(no errors — zero lines of output, or "Found 0 errors")
```

The layout.tsx change adds a Tailwind class string — no type impact.

- [ ] **Step 6: Final visual sweep**

Check these pages to confirm no regressions:

| URL | What to check |
|-----|--------------|
| `http://localhost:3000` | Hero + cards show escalating grain. Body grain barely visible. |
| `http://localhost:3000/courses` | Course cards show Tier 2 grain. No text/button regressions. |
| `http://localhost:3000/marketplace` | Marketplace cards correct. |
| `http://localhost:3000/jobs` | Job listings correct. |
| Any page | Navbar renders above all grain overlays. Scrolling normal. |

- [ ] **Step 7: Commit**

```bash
cd /Users/snehakaushik/hustleclubv1
git add src/globals.css src/app/layout.tsx
git commit -m "feat(design): add Tier 3 hero texture, reduced-motion reset, body isolate fix

Completes Phase 1 atmospheric textures. Three-tier CRT grain system
live across body, cards, and opt-in hero sections. Accessibility
reset respects prefers-reduced-motion."
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|-----------------|-----------|
| SVG `feTurbulence` filter, baseFrequency 0.65, numOctaves 3, stitchTiles stitch | Task 1 Step 2 |
| `feColorMatrix saturate=0` | Task 1 Step 2 |
| `--grain-filter` custom property | Task 1 Step 2 |
| Tier 1 body scanlines: 0.022 opacity, 3px spacing | Task 1 Step 3 |
| Tier 1 body grain: 0.028 opacity | Task 1 Step 3 |
| Tier 2 card/surface: combined `background-image`, 0.045 opacity, 2px spacing, 0.03 scanline channel | Task 2 Step 2 |
| Tier 2 requires `position: relative` on parent | Task 2 Step 1 + 2 |
| Tier 3 `.hero-texture` opt-in, `isolation: isolate`, `z-index: -1` | Task 3 Step 1 |
| Tier 3 grain 0.07, scanlines 0.05 alpha, 2px spacing | Task 3 Step 1 |
| `@media (prefers-reduced-motion)` reset | Task 3 Step 1 |
| `<body>` gets `isolate` class | Task 3 Step 2 |
| `pointer-events: none` on all overlays | Tasks 1, 2, 3 ✅ |
| Fixed z-index 1–2 on body overlays (below navbar z-50) | Task 1 Step 3 ✅ |
| No new files, no new dependencies | Confirmed ✅ |

All spec requirements covered. No gaps.

**Placeholder scan:** No TBDs, no "implement later", no vague steps. All CSS is complete and exact.

**Consistency check:** `--grain-filter` defined in Task 1 Step 2, referenced as `var(--grain-filter)` in Tasks 1, 2, and 3. Consistent. Opacity values match the spec table exactly across all three tiers.
