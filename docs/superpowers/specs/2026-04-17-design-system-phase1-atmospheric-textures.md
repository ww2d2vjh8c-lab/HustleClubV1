# Design Spec: GTA San Andreas Neon Design System — Phase 1: Atmospheric Textures
**Date:** 2026-04-17  
**Project:** HustleClub V1  
**Phase:** 1 of 3 (Atmospheric Textures → Motion & Glitch → UI Chrome Accents)

---

## Overview

Layer a retro-futuristic GTA San Andreas atmosphere onto the existing HustleClub design system using CSS-only techniques: CRT scanlines and SVG `feTurbulence` film grain. No JS, no new files, no component changes. The effect escalates in intensity based on surface prominence.

---

## SVG Noise Filter

A single `<filter id="hc-grain">` is defined as an SVG data URI and stored as a CSS custom property `--grain-filter`. All three intensity tiers reference the same filter — only opacity varies.

**Filter parameters:**
- `feTurbulence`: type `fractalNoise`, baseFrequency `0.65`, numOctaves `3`, stitchTiles `stitch`
- `feColorMatrix`: type `saturate`, values `0` (isolates luminance, strips colour from grain)

```css
--grain-filter: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='hc-grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3C/svg%3E#hc-grain");
```

---

## Three-Tier Intensity System

Grain opacity and scanline opacity escalate with surface prominence.

| Tier | Applied to | Grain opacity | Scanline opacity | Scanline spacing |
|------|-----------|--------------|-----------------|-----------------|
| 1 — Body | Entire page background | `0.028` | `0.022` | `3px` |
| 2 — Cards | `.app-card`, `.app-surface` | `0.045` | `0.030` | `2px` |
| 3 — Hero | `.hero-texture` (opt-in) | `0.070` | `0.050` | `2px` |

---

## Implementation

### Scanlines

`body::before` — fixed full-viewport, `pointer-events: none`, `z-index: 1`:
```css
background-image: repeating-linear-gradient(
  0deg,
  transparent,
  transparent 2px,
  rgba(0,0,0,0.022) 2px,
  rgba(0,0,0,0.022) 3px
);
```

### Grain

`body::after` — fixed full-viewport, `pointer-events: none`, `z-index: 2`:
```css
background-image: var(--grain-filter);
opacity: 0.028;
```

### Card / Surface Tier (Tier 2)

`.app-card::after` and `.app-surface::after` — `position: absolute`, `inset: 0`, `border-radius: inherit`, `pointer-events: none`, `z-index: 1`, `overflow: hidden` on parent:
```css
background-image:
  repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.03) 1px, rgba(0,0,0,0.03) 2px),
  var(--grain-filter);
opacity: 0.045;
```
Note: both scanlines and grain are stacked in one `background-image` declaration on the single `::after` pseudo-element. No second pseudo-element needed.

### Hero Tier (Tier 3)

`.hero-texture` — opt-in utility class. Apply to any section or div that should get the full treatment:
```css
.hero-texture {
  position: relative;
  isolation: isolate;
}
.hero-texture::after {
  /* grain at 0.07 + scanlines at 0.05, 2px spacing */
}
```

### Accessibility

```css
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

---

## Files Changed

| File | Change type | What changes |
|------|------------|-------------|
| `src/globals.css` | Addition only | `--grain-filter` custom property, `body::before`/`::after`, `.app-card::after`, `.app-surface::after`, `.hero-texture`, reduced-motion reset |
| `src/app/layout.tsx` | 1 line | Add `isolate` to `<body>` className for correct Safari compositing |

No new files. No new dependencies. No component changes. TypeScript unaffected.

---

## Constraints

- All overlays use `pointer-events: none` — zero interactivity impact
- Fixed overlays use `z-index: 1–2` — below all app UI (navbar z-50, modals z-100+)
- `.app-card` and `.app-surface` require `position: relative` (already true in existing code)
- `.hero-texture` requires `isolation: isolate` on the element itself (included in the class)
- Grain filter is defined once and reused — no duplication across tiers

---

## Phase 2 Preview (not in scope here)

After Phase 1 ships: Motion & Glitch — keyframe glitch animations for display headings, scanline sweep on card hover, neon pulse on `.btn-neon-solid`.
