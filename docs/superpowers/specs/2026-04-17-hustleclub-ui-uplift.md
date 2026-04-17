# HustleClub UI Uplift — Design Spec
**Date:** 2026-04-17
**Scope:** Courses page restyle + Homepage "What's Happening Now" section

---

## Overview

Two targeted improvements to make HustleClub feel real-world ready:

1. **Courses page** — complete restyle from broken light-theme Tailwind to the dark neon design system. Adds a featured wide-card slot (most enrolled) above a regular card grid. Instructor becomes a clickable `@creator` link.
2. **Homepage** — new "What's Happening Now" section inserted between the channel cards and "How it works". Three cards (latest course, latest open job, latest marketplace item) with social proof, activity signals, creator avatars, and urgency cues. Topped by a scrolling live ticker showing platform activity.

Both changes are in-place rewrites. No new files. No new dependencies.

---

## Part 1 — Courses Page Restyle

### File
`src/app/courses/page.tsx` — rewrite `CoursesPage` render block and `CourseCard` component inline.

### Page header
Match jobs/marketplace pattern:
```
section-tag   → "Knowledge"
page-title    → THE <accent-orange>COURSES</accent-orange>
page-subtitle → "Learn real skills from verified creators. Enroll in seconds."
```

### Search bar
Styled identically to marketplace page:
- `<input>` with `field-input` class, `flex: 1`, placeholder "Search courses, creators, topics..."
- `<select>` with `field-input` class, options: Newest / Price: Low → High / Price: High → Low
- `<button>` with `btn-neon` class, label "SEARCH"

### Featured wide card (most enrolled)
**Which course:** The course with the highest value in `enrollmentMap`. If all are 0 or the list is empty, skip this slot and show only the grid.

**Layout:** Full-width horizontal card, `display: flex`:
- Left: 220px image column — `aspect-ratio: 4/3`, dark gradient bg if no `image_url`, emoji placeholder
- Right: body column, flex-column, space-between
  - Top: `FEATURED · N students` badge (orange pill), title (display font), `@creator` link, 2-line description summary, pill row (lesson count from `parseCourseDescription`, outcomes count, "Self-paced")
  - Bottom: price (neon-green) + "ENROLL NOW →" button (btn-neon-solid)
- Top accent border: `border-top: 2px solid var(--neon-orange)`

**Section label above featured card:** `⭐ Most enrolled` in `sec-label` mono style.

### Course grid (remaining courses)
All courses except the featured one, rendered as cards:
- `display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem`
- Each card: `app-card card-lift` with `overflow: hidden`
  - Image: 16/9 aspect ratio, dark gradient bg if no image
  - Body: title (display font), `@creator` link (neon-orange, links to `/u/[username]`), card-footer: price (neon-green) + enrollment pill (muted)
- **Section label above grid:** `All courses` mono label, right-aligned "See all →" link

### Instructor link
All occurrences of instructor name render as:
```tsx
<Link href={`/u/${course.instructor}`} style={{ color: "var(--neon-orange)", fontSize: ".72rem" }}>
  @{course.instructor}
</Link>
```
Note: the `instructor` column stores the username string directly. If null, render nothing.

### Empty state
Match marketplace empty state:
- Centered panel, `app-card`, display-font "NO COURSES YET", mono subtitle
- If search query active: `No results for "${q}"` — otherwise: "Check back soon — creators are building"

### Data
No new queries. Existing `enrollmentMap` determines featured slot. Existing `parseCourseDescription` provides lesson/outcome counts.

---

## Part 2 — Homepage "What's Happening Now"

### File
`src/app/page.tsx` — add three new Supabase queries + one new section + ticker component inline.

### Placement
New section inserted between the "THREE WAYS TO GET PAID" section and the "GET STARTED IN MINUTES" section.

### New Supabase queries (added to `HomePage`)
Three parallel queries using `Promise.all`:

```ts
const [latestCourse, latestJob, latestItem] = await Promise.all([
  supabase.from("courses").select("id, title, description, instructor, image_url, price")
    .eq("status", "published").order("created_at", { ascending: false }).limit(1).single(),
  supabase.from("jobs").select("id, title, description, budget, type, creator_id, created_at")
    .eq("is_open", true).order("created_at", { ascending: false }).limit(1).single(),
  supabase.from("marketplace_items").select("id, title, description, price, image_url")
    .eq("is_published", true).eq("is_sold", false).order("created_at", { ascending: false }).limit(1).single(),
])
```

For the job card, also fetch application count:
```ts
const { count: jobApplicationCount } = latestJob.data
  ? await supabase.from("job_applications")
      .select("*", { count: "exact", head: true })
      .eq("job_id", latestJob.data.id)
  : { count: 0 }
```

For the course card, fetch enrollment count:
```ts
const { count: courseEnrollmentCount } = latestCourse.data
  ? await supabase.from("course_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("course_id", latestCourse.data.id)
  : { count: 0 }
```

For marketplace sold count:
```ts
const { count: itemSoldCount } = latestItem.data
  ? await supabase.from("marketplace_orders")
      .select("*", { count: "exact", head: true })
      .eq("item_id", latestItem.data.id)
  : { count: 0 }
```

**If any query returns no data:** skip that card slot (render 2 or 1 cards). If all three return empty, hide the entire section.

### Live ticker
Full-width scrolling strip above the section header. CSS `animation: ticker linear infinite` (no JS). Content is **static copy** — no real-time events table needed:

```
● @creator just enrolled in a course  ·  ● New job posted minutes ago  ·  ● Digital item sold today  ·  ● New creator joined the platform  ·  ● Course enrollment happening now
```

Duplicated for seamless loop. Subtle — `opacity: 0.7` on text. Green pulse dot per item.

### Section header
```
live-dot (pulsing green) + "Live on HustleClub"   ← eyebrow
"PEOPLE ARE HUSTLING RIGHT NOW"                   ← h2, display font
"Join them — or watch what's possible."           ← subtitle
```
Right side: three ghost pills linking to `/courses`, `/jobs`, `/marketplace`.

### Cards — shared anatomy
Each card: `app-card`, `card-lift`, `border-top: 2px solid [accent-color]`, `overflow: hidden`
- **Image area:** 16/9, dark gradient bg if no image, emoji placeholder. Top-right activity badge (absolute positioned): enrollment/application/sold count with pulsing dot.
- **Body:**
  - Creator row: 24px avatar circle (gradient bg, initials, colour-matched), `@username` link, time-since-posted (e.g. "2d ago" using `created_at`)
  - Title (display font)
  - Proof row: 3 small mono pills (varies by card type — see below)
  - For courses + marketplace: one-line hardcoded micro-quote (static copy, not from DB)
  - For jobs: urgency strip if `jobApplicationCount > 0`: "⚡ N people already applied — move fast"
- **Footer:** price (colour-matched) + CTA button

### Card-specific proof rows

**Course card:**
- `⭐ 4.9` (static — no rating system yet, shown only if `courseEnrollmentCount > 10`)
- `👥 N students` (real: `courseEnrollmentCount`)
- `📚 N lessons` (real: from `parseCourseDescription`)
- Micro-quote: `"Changed how I pitch clients completely."` (static, always shown)

**Job card:**
- `💰 ₹N` (real: `budget`)
- Job type tag (real: `type`)
- `🌍 Remote` (static)
- Urgency strip: `⚡ N people already applied` (real: `jobApplicationCount`, shown only if > 0)

**Marketplace card:**
- `🛒 N sold` (real: `itemSoldCount`, shown only if > 0, else show "New")
- `✏️ Editable` (static)
- `📲 Instant delivery` (static)
- Micro-quote: `"Posted 5 reels in a weekend with these."` (static, always shown)

### Creator avatar
For the job card, the creator info comes from `latestJob.data.creator_id`. Add a targeted profile fetch:
```ts
const { data: jobCreator } = latestJob.data
  ? await supabase.from("profiles").select("username, avatar_url, full_name")
      .eq("id", latestJob.data.creator_id).single()
  : { data: null }
```
Avatar: if `avatar_url` exists, use `<Image>`. Otherwise, render a gradient circle with the first letter of `username` or `full_name`.

For course instructor: use `course.instructor` string directly (already a username).
For marketplace item: no creator field on `marketplace_items` — show item initials avatar instead.

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/courses/page.tsx` | Full restyle of render block + `CourseCard` component. No new files. No new queries. |
| `src/app/page.tsx` | 5 new Supabase queries + new section + ticker. No new files. |

No new components. No new dependencies. TypeScript must pass (`npx tsc --noEmit`) after each file.

---

## Constraints
- `escapeHTML()` or JSX auto-escaping handles all user content rendered to DOM
- All DB values that could be null are guarded before rendering
- Section hides entirely if all three live-data queries return empty
- Static copy (micro-quotes, ticker text) is clearly marked as such in code comments
- Instructor link only renders if `course.instructor` is non-null
- Avatar image only renders if `avatar_url` is non-null; falls back to gradient initials circle
- No `alert()` — all errors handled via early returns or conditional renders
