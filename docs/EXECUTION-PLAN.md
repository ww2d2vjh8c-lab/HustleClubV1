# HustleClub — Master Execution Plan
### Brain: Claude Cowork | Executor: Claude Code (VS Code)
### Date: March 2026 | Version: 1.0

---

## ⚠️ STANDING INSTRUCTIONS FOR ALL EXECUTION

**Before every task:**
1. Run `npx tsc --noEmit` — confirm 0 errors before touching anything
2. Commit current state: `git add -A && git commit -m "checkpoint: before [task name]"`
3. Execute ONLY the task described — no scope creep
4. Run `npx tsc --noEmit` again after completing the task
5. Test the affected feature manually before moving to the next task

**Never:**
- Modify more than the files listed in the STEPS section
- Skip the TypeScript check
- Assume a redirect means a function returns `never` without explicit annotation
- Delete a file without confirming no imports reference it first

---

## PHASE 1 — SYSTEM UNDERSTANDING

### What This Project Is

HustleClub is a multi-sided creator economy platform for India. Three revenue streams in one Next.js 16 + Supabase app:

- **Courses** — creators sell knowledge, users enroll and learn
- **UGC Gig Jobs** — creators post jobs, users apply and get hired
- **Thrift/Digital Marketplace** — creators list items, users buy with full payment flow

**Roles**: `user` → `creator` (approved) → `admin`

### Architecture Summary

```
HTTP Request
  → middleware (proxy.ts — currently broken, no session refresh)
  → RootLayout (SSR, reads Supabase session + role → renders Navbar)
  → Page (requireUser/requireCreator/requireAdmin guard → data fetch)
  → Server Action ("use server" — called from client components)
  → Supabase (RLS as defense-in-depth)
```

### Critical Data Flows

**Auth**: Login → Supabase Auth cookie → SSR cookie-aware client → role from `profiles` table → Navbar rendered server-side

**Payment**: BuyButton → sessionStorage idempotency key → `createOrder()` server action → `startMarketplaceCheckoutForItem()` → FSM state machine → `is_sold = true` atomic lock → `marketplace_order` created → `revalidatePath()`

**Impersonation**: Admin sets `impersonate_user_id` httpOnly cookie → `requireUser()` swaps `user.id` with cookie value → all DB queries run as impersonated user

### Modules and Their Health

| Module | Health | Notes |
|---|---|---|
| `lib/payments/service.ts` | ✅ Excellent | Best code in the codebase — idempotent FSM, webhook dedup |
| `lib/payments/state.ts` | ✅ Excellent | Clean FSM constants and transition guards |
| `lib/supabase/` | ✅ Good | server/client/admin separation is correct |
| `lib/notifications/` | ✅ Good | Good pure utilities |
| `lib/profile/validation.ts` | ✅ Good | Validators exist but are bypassed server-side |
| `lib/auth/` (wrappers) | ⚠️ Fragile | Return type `undefined` bug, redundant layer |
| `lib/admin/impersonation*` | ❌ Broken | 3 duplicate implementations |
| `lib/audit/` | ⚠️ Bypassed | Helper function exists but inline inserts dominate |
| `app/notifications/page.tsx` | ⚠️ God Component | 280+ lines, 3 concerns |
| `proxy.ts` | ❌ Broken | Empty shell — no Supabase session refresh |
| `app/layout.tsx` | ⚠️ Perf issue | `force-dynamic` on root layout kills all caching |
| `actions/profile/update.ts` | ❌ Security | No input validation before DB write |
| `lib/jobs/applicantActions.ts` | ❌ Security | No auth guard in server action |

---

## PHASE 2 — LISTED ISSUES (From Audit)

> Issues extracted from `docs/AUDIT.md`, categorized by severity.

### 🔴 CRITICAL — Fix Before Any Production Deployment

**ISSUE-01: Broken Middleware (No Session Refresh)**
- **File**: `proxy.ts` (root)
- **Problem**: File is named `proxy.ts`, not `middleware.ts`. The exported function is `proxy()`, not `middleware()`. Next.js ignores this file entirely. Supabase SSR session cookies are never refreshed, causing silent session expiry during active browsing.
- **Impact**: Users get logged out unexpectedly. Authenticated pages may show stale data. All SSR auth is built on a foundation that doesn't refresh tokens.

**ISSUE-02: Webhook Secret is Optional — Silently Accepts All Requests**
- **File**: `src/app/api/payments/webhook/route.ts`
- **Problem**: The secret validation is wrapped in `if (secret)` — if `PAYMENT_WEBHOOK_SECRET` is not set in env, ALL incoming requests pass validation. In production this means anyone can forge payment confirmations.
- **Impact**: Financial fraud vector. Any attacker can POST a fake `payment_succeeded` event and unlock marketplace items without paying.

**ISSUE-03: `updateApplicationStatus` Has No Auth Guard**
- **File**: `src/lib/jobs/applicantActions.ts`
- **Problem**: Server action creates a Supabase client but never calls `requireUser()`, `requireCreator()`, or any auth check. Relies solely on RLS. No ownership check — doesn't verify the calling creator owns the job.
- **Impact**: Security hole at application layer. RLS is the only defense. Any logged-in user who can call the action could attempt to accept/reject applications for jobs they don't own.

**ISSUE-04: `updateProfile` Server Action Has No Input Validation**
- **File**: `src/actions/profile/update.ts`
- **Problem**: Writes raw `FormData` values directly to the `profiles` table without calling `validateUsername()`, `validateFullName()`, or `validateBio()`. These validators exist in `lib/profile/validation.ts` but are only used client-side in `ProfileForm.tsx`. A direct API call bypasses all validation.
- **Impact**: Arbitrary strings (empty usernames, XSS payloads in bio, invalid characters) can be written to the DB.

**ISSUE-05: Marketplace Storage RLS Too Permissive**
- **File**: `supabase/migrations/20260226_hustleclub_baseline.sql`
- **Problem**: The `UPDATE` and `DELETE` policies for the `marketplace` storage bucket allow any authenticated user to overwrite or delete any marketplace image. The `avatars` bucket correctly uses `split_part(name, '/', 1) = auth.uid()::text` — the marketplace bucket does not.
- **Impact**: Any logged-in user can delete or replace another user's marketplace listing images.

---

### 🟠 HIGH — Fix Before Scale / Shared Team Use

**ISSUE-06: Impersonation System Duplicated 3 Times**
- **Files**: `lib/admin/impersonation.ts`, `lib/admin/impersonation.actions.ts`, `lib/admin/impersonation/actions.ts`, `lib/admin/impersonation/helpers.ts`, `lib/admin/impersonation.constants.ts`, `lib/admin/impersonation/constants.ts`
- **Problem**: Three full implementations of `startImpersonation`, `stopImpersonation`, `getImpersonatedUserId`. Two separate `IMPERSONATE_COOKIE` constants. The `impersonation/actions.ts` copy imports from `@/lib/auth` (different path) while the others import from `@/lib/supabase/auth`.
- **Impact**: Updating impersonation logic in one file silently diverges from the others. The import path difference means `impersonation/actions.ts` may use a different auth guard implementation.

**ISSUE-07: Two Audit Log Tables with Identical Schemas**
- **Files**: `lib/admin/logAdminAction.ts` → `admin_audit_logs`, `lib/audit/log.ts` → `audit_logs`
- **Problem**: Both tables have `actor_id, action, target_type, target_id, metadata, created_at`. Two helper functions exist, but ~80% of audit writes in action files bypass both helpers and inline `supabase.from("audit_logs").insert(...)` directly.
- **Impact**: Impossible to add enrichment (IP logging, event queuing) without touching ~8 callsites. Two tables mean split audit history.

**ISSUE-08: `requireUser()` in `lib/auth/` Returns `undefined` on Redirect**
- **File**: `src/lib/auth/requireUser.ts`
- **Problem**: The `redirect()` call is inside a `try/catch`, but TypeScript doesn't know `redirect()` throws. The function return type is inferred as `{ user, supabase } | undefined`. Callers that destructure `const { user } = await requireUser()` will throw a runtime error if the undefined path is hit.
- **Impact**: TypeScript gives false confidence. Runtime crashes possible in edge cases.

**ISSUE-09: `Role` Type Redeclared in 7+ Files**
- **Files**: `app/admin/users/page.tsx`, `app/dashboard/page.tsx`, `app/notifications/page.tsx`, `NotificationsLiveClient.tsx`, `components/admin/RoleSwitcher.tsx`, `components/navigation/Navbar.tsx`, `lib/auth/requireRole.ts`
- **Problem**: `type Role = "user" | "creator" | "admin"` is declared inline in each file. No single source of truth. If a new role is added, every file must be updated.
- **Impact**: Maintainability risk. Divergence possible.

**ISSUE-10: `force-dynamic` on Root Layout Disables All Static Optimization**
- **File**: `src/app/layout.tsx`
- **Problem**: `export const dynamic = "force-dynamic"` and `export const revalidate = 0` on the root layout forces every page — including fully public ones (course listings, job listings, marketplace browsing) — into full SSR on every request.
- **Impact**: No page can be statically generated or edge-cached. Significant performance ceiling for Indian-scale traffic.

---

### 🟡 MEDIUM — Fix for Code Quality and Maintainability

**ISSUE-11: `createJob` Uses Relative Import Instead of Path Alias**
- **File**: `src/actions/jobs.ts`
- **Problem**: `import { requireCreator } from "../lib/supabase/auth"` instead of `import { requireCreator } from "@/lib/supabase/auth"`.
- **Impact**: Minor. Inconsistent style, breaks if file is moved.

**ISSUE-12: `applyToJob` Accepts `number` for bigint Job ID**
- **File**: `src/actions/job-applications.ts`
- **Problem**: `applyToJob(jobId: number)` — Postgres `bigint` can exceed JavaScript's `Number.MAX_SAFE_INTEGER` (2^53). The parameter should be `string`.
- **Impact**: Silent data truncation if jobs table exceeds ~9 quadrillion rows. Low probability now, correct practice always.

**ISSUE-13: Notifications Page is a 280-Line God Component**
- **File**: `src/app/notifications/page.tsx`
- **Problem**: Single server component handles data fetching for 3 roles, business logic (dedup, sorting), and rendering. 5-10 sequential DB queries for creator/admin roles. Adding new notification types requires modifying this file.
- **Impact**: Hard to test, hard to extend, slow at scale.

**ISSUE-14: Creator Dashboard Defines Inline Duplicate Components**
- **File**: `src/app/creator/dashboard/page.tsx`
- **Problem**: `MetricCard`, `Panel`, and `OrderStatusBadge` defined as local functions. `OrderStatusBadge` also exists independently in `src/components/marketplace/OrderStatusBadge.tsx`.
- **Impact**: Two implementations of the same component will visually diverge over time.

**ISSUE-15: `BuyButton` Uses `alert()` for Error and Success States**
- **File**: `src/components/marketplace/BuyButton.tsx`
- **Problem**: Both success and error paths call `alert()` — a blocking, unstyled, unloggable browser dialog. Breaks mobile UX. Cannot be unit tested.
- **Impact**: Poor user experience. Not production-appropriate.

**ISSUE-16: `isProfileComplete` Requires Avatar but Form Doesn't Enforce It**
- **File**: `src/lib/profile/isProfileComplete.ts` + `ProfileForm.tsx`
- **Problem**: `isProfileComplete` checks `avatar_url`, but the avatar upload is an optional separate component not required in the main form. Users who fill in all text fields but skip the avatar are silently blocked from gated features with no explanation.
- **Impact**: Confusing user experience. Silent failures.

**ISSUE-17: Admin Dashboard Makes 16 Parallel DB Queries**
- **File**: `src/app/admin/dashboard/page.tsx`
- **Problem**: `Promise.all([16 queries])` — parallel is correct, but 16 round-trips per page load is unsustainable. Should be a single aggregate SQL query or materialized view.
- **Impact**: Performance degrades linearly with DB latency.

**ISSUE-18: No Rate Limiting on Job Applications or Creator Requests**
- **Problem**: No application-level rate limiting on job applications, creator requests, or checkout initiation. DB unique constraints prevent duplicate applications but not flooding.
- **Impact**: Users can hammer the checkout endpoint. Creator request spam possible.

---

### 🔵 LOW — Polish and Completeness

**ISSUE-19: No `error.tsx` or `not-found.tsx` in App Directory**
- **Problem**: Next.js 13+ supports route-level error boundaries via `error.tsx` and custom 404s via `not-found.tsx`. The app has neither (only 2 `loading.tsx` files exist, in `/admin/creator-analytics` and `/jobs`).
- **Impact**: Unhandled errors show default Next.js error page. Stack traces may be exposed in development builds.

**ISSUE-20: `proxy.ts` Naming Is Misleading**
- **Problem**: Even after fixing the middleware logic, the file is named `proxy.ts`. The correct Next.js convention is `middleware.ts` at the root.
- **Impact**: Confusing to any developer who knows Next.js. The file will be ignored unless renamed.

**ISSUE-21: Two Redundant DB Column Pairs with Trigger Sync**
- **DB Table**: `marketplace_items` has `seller_id` AND `user_id` (synced via trigger). `jobs` has `creator_id` AND `created_by` (synced via trigger).
- **Problem**: Legacy renames were done via trigger instead of migration. If a trigger ever fails, the columns diverge silently. Queries using either column name get different results depending on write path.
- **Impact**: Subtle data inconsistency risk.

**ISSUE-22: Webhook Secret Env Variable Not Validated at Startup**
- **Problem**: If `PAYMENT_WEBHOOK_SECRET` is not set, the app silently skips webhook authentication (see ISSUE-02). No startup validation warns about this.
- **Impact**: Easy to deploy to production without realizing webhook auth is disabled.

---

## PHASE 3 — HIDDEN ISSUES (Beyond the Audit)

> Issues discovered through deeper analysis not covered in AUDIT.md.

### HIDDEN-01: `impersonation/actions.ts` Imports from `@/lib/auth` — Different Module Than Other Copies

The third copy of impersonation at `src/lib/admin/impersonation/actions.ts` imports `requireAdmin` from `@/lib/auth` (which resolves to `src/lib/auth/index.ts`), while the canonical copy at `src/lib/admin/impersonation.ts` imports from `@/lib/supabase/auth`. These are different modules with subtly different behavior — the `lib/auth/requireAdmin.ts` wrapper catches errors and redirects, while `lib/supabase/auth.ts`'s `requireAdmin` throws. This means depending on which copy is imported, impersonation has different error handling behavior.

### HIDDEN-02: `createOrder` Calls `requireUser()` Which Can Return `undefined`

`src/app/marketplace/[id]/buy/actions.ts` does:
```ts
const { user } = await requireUser();
```
Because `requireUser()` in `lib/auth/requireUser.ts` returns `{ user, supabase } | undefined` (due to the `try/catch` swallowing the `redirect()`), destructuring `user` from a possible `undefined` will throw a runtime TypeError if the auth check fails and `redirect()` somehow doesn't prevent execution. This is the same bug as ISSUE-08 but in a critical payment codepath.

### HIDDEN-03: Webhook Auth Bypassed in Development by Design — No Warning

The `if (secret)` pattern in the webhook route means that running `npm run dev` with no `.env.local` or without `PAYMENT_WEBHOOK_SECRET` silently accepts all webhook requests. Since the mock payment provider sends webhooks to localhost, this works in dev — but if a developer forgets to add the secret before deploying to staging/production, they have a live, unauthenticated payment endpoint with no warning anywhere.

### HIDDEN-04: `revalidatePath` in `createOrder` Runs Even on Checkout Failure

In `src/app/marketplace/[id]/buy/actions.ts`, `revalidatePath()` calls are at the end of the function unconditionally:
```ts
const checkout = await startMarketplaceCheckoutForItem(...)  // can throw
revalidatePath("/marketplace");  // only reached if checkout succeeds
```
Actually looking at this again — `revalidatePath` is AFTER the checkout call, so if the checkout throws, the `revalidatePath` calls are never reached. This is actually fine. However, the return value `checkout` is returned and the `BuyButton` client component calls `alert()` on the `checkout.message` — meaning if checkout is in `processing` state (not yet succeeded), the user sees a success-ish message before the payment is confirmed. This is a UX expectation mismatch.

### HIDDEN-05: Only 2 `loading.tsx` Files in the Entire App

Next.js App Router uses `loading.tsx` files as instant loading skeletons via Suspense. The app has them only for `/admin/creator-analytics` and `/jobs`. All other pages (marketplace, courses, notifications, creator dashboard, admin dashboard) have no loading state — they block the UI until all server data is fetched. On slow connections (common in India) this creates a blank/frozen UI.

### HIDDEN-06: `app/layout.tsx` Has Both `force-dynamic` AND `revalidate = 0`

These two exports are redundant — `force-dynamic` already implies `revalidate = 0`. Having both is a sign the developer was unsure which setting to use. More importantly, `force-dynamic` on the ROOT layout propagates to ALL children — there is no way for a child page to opt back into static generation while the root layout has `force-dynamic`.

### HIDDEN-07: No Global `error.tsx` — Next.js Shows Stack Traces

Without a root-level `src/app/error.tsx`, any unhandled server component throw will bubble up to Next.js's default error page, which in development shows full stack traces (including file paths, line numbers, and potentially Supabase error details). If someone manages to see the dev error page in a staging deployment, internal architecture is exposed.

### HIDDEN-08: `createJob` in `src/actions/jobs.ts` Uses Relative Import

This file uses `"../lib/supabase/auth"` while all other action files use `"@/lib/supabase/auth"`. This is in the audit but the hidden dimension is: this relative path will silently break if the `src/actions/jobs.ts` file is ever moved to a subdirectory (e.g., `src/actions/jobs/create.ts`), producing a confusing module-not-found error.

### HIDDEN-09: `admin_audit_logs` Table Is Effectively Dead

`logAdminAction()` writes to `admin_audit_logs` but `logAdminAction` is never actually called from any action file — verified by grep. All admin action files either call `logAuditEvent()` or inline direct `supabase.from("audit_logs").insert()`. The `admin_audit_logs` table exists in the DB schema and the helper function exists in the codebase, but the table is likely always empty. This means:
1. The admin audit trail is incomplete
2. The table wastes schema space
3. Future developers may add writes to `admin_audit_logs` thinking it's the correct table, creating a split log

### HIDDEN-10: Profile Update Null Username Redirect Bug

In `src/actions/profile/update.ts`, on successful update the code redirects to `/u/${username}`. If the username field in the form is empty or null (which is possible since there's no validation), the user is redirected to `/u/null` — a URL that returns a 404. The user's profile was written to the DB with `username = null` and they have no way to navigate back to fix it without manually typing `/profile`.

### HIDDEN-11: `isProfileComplete` Avatar Requirement Creates Invisible Wall

A user can complete the entire profile form (username, full name, bio) and click save. The app redirects them away from gated features like applying to jobs. There is no visible error message explaining that an avatar is also required — the `isProfileComplete` check silently fails and the user is redirected. There's no UI feedback pointing to the missing avatar. This is a silent UX dead end.

### HIDDEN-12: No Supabase Realtime Cleanup in `NotificationsLiveClient`

`NotificationsLiveClient.tsx` subscribes to Supabase Realtime channels. If the component unmounts and remounts (e.g., React StrictMode in development, or navigation), the channel subscription may not be properly cleaned up, leading to duplicate event handlers and memory leaks. The `useEffect` cleanup function must call `channel.unsubscribe()`.

---

## PHASE 4 — MASTER EXECUTION PLAN

> Ordered by: security first, then correctness, then maintainability, then performance.
> Each phase is safe to deploy independently.

### Execution Order and Dependencies

```
PHASE A: Security Fixes (ISSUE-01, 02, 03, 04, 05)
  ↓ (no deps on other phases)
PHASE B: TypeScript Correctness (ISSUE-08, 12 + HIDDEN-02)
  ↓ (safe after Phase A)
PHASE C: Duplicate Elimination (ISSUE-06, 07, 09)
  ↓ (safe after Phase B — types must exist before merging)
PHASE D: Code Quality (ISSUE-11, 13, 14, 15, 16 + HIDDEN-05, 07, 10, 11, 12)
  ↓ (safe after Phase C)
PHASE E: Performance (ISSUE-10, 17)
  ↓ (only after app is stable)
PHASE F: Production Hardening (ISSUE-18, 22 + rate limiting, env validation)
  ↓ (final step before going live)
```

### Risk Assessment Per Phase

| Phase | Risk | Reason |
|---|---|---|
| A | 🟠 Medium | Middleware change touches every request; storage policy touches DB |
| B | 🟢 Low | Type changes, no runtime behavior change |
| C | 🟠 Medium | Import path changes across many files; must grep all consumers |
| D | 🟢 Low | Component extraction, UI improvements |
| E | 🟡 Medium-Low | Removing force-dynamic requires manual testing of every public page |
| F | 🟢 Low | Additive changes only |

---

## PHASE 5 — MICROTASK BREAKDOWN

> Each task is atomic. One file or one concern. Test after each.

---

### PHASE A: Security Fixes

**TASK A-01**: Rename `proxy.ts` → `middleware.ts` and implement Supabase session refresh
- **Files**: `proxy.ts` → `middleware.ts`
- **Risk**: Medium — affects every request
- **Test**: Login, browse 5 pages, session stays active

**TASK A-02**: Implement webhook signature validation enforcement
- **File**: `src/app/api/payments/webhook/route.ts`
- **Risk**: Low — additive security, no behavior change when secret IS set
- **Test**: POST to webhook without secret → 401. With correct secret → 200.

**TASK A-03**: Add `requireCreator()` + ownership check to `updateApplicationStatus`
- **File**: `src/lib/jobs/applicantActions.ts`
- **Risk**: Low — adds auth, doesn't change happy path
- **Test**: Call with non-creator user → error. Creator who owns job → success. Creator who doesn't own job → error.

**TASK A-04**: Add server-side validation to `updateProfile` server action
- **File**: `src/actions/profile/update.ts`
- **Risk**: Low — validation is additive
- **Test**: Submit empty username → error returned. Submit valid profile → saves. Check redirect URL is not `/u/null`.

**TASK A-05**: Fix marketplace storage RLS policies in DB migration
- **File**: New migration in `supabase/migrations/`
- **Risk**: Low — additive SQL policy, doesn't change app code
- **Test**: As user A, attempt to DELETE user B's marketplace image → 403.

---

### PHASE B: TypeScript Correctness

**TASK B-01**: Fix `requireUser()` return type — handle `redirect()` as `never` path
- **File**: `src/lib/auth/requireUser.ts`
- **Risk**: Low — type-only change
- **Test**: `npx tsc --noEmit` passes with 0 errors. Pages that call `requireUser()` don't require null-checking.

**TASK B-02**: Fix `requireCreator()` and `requireAdmin()` — same pattern
- **Files**: `src/lib/auth/requireCreator.ts`, `src/lib/auth/requireAdmin.ts`
- **Risk**: Low — same fix as B-01
- **Test**: `npx tsc --noEmit` passes.

**TASK B-03**: Fix `applyToJob` parameter type from `number` to `string`
- **File**: `src/actions/job-applications.ts`
- **Risk**: Low — must update all callers to pass string
- **Test**: `npx tsc --noEmit` passes. Job application still works.

---

### PHASE C: Duplicate Elimination

**TASK C-01**: Extract `Role` type to `src/types/index.ts`
- **File**: `src/types/index.ts` (new or existing)
- **Risk**: Low — find-and-replace, no behavior change
- **Test**: `npx tsc --noEmit` passes. Grep confirms no local Role declarations remain.

**TASK C-02**: Consolidate impersonation into single module at `src/lib/auth/impersonation.ts`
- **Files affected**: `lib/admin/impersonation.ts` (keep, refactor), `lib/admin/impersonation.actions.ts` (delete), `lib/admin/impersonation/actions.ts` (delete), `lib/admin/impersonation/helpers.ts` (delete), `lib/admin/impersonation.constants.ts` (delete), `lib/admin/impersonation/constants.ts` (delete)
- **Risk**: Medium — must update all import sites
- **Test**: Admin impersonation start/stop works. `npx tsc --noEmit` passes.

**TASK C-03**: Fix import path in `src/actions/jobs.ts`
- **File**: `src/actions/jobs.ts`
- **Risk**: Very low — 1 line change
- **Test**: `npx tsc --noEmit` passes.

**TASK C-04**: Consolidate audit logging — create `src/lib/db/audit.ts` canonical function
- **Files**: New `src/lib/db/audit.ts`, update `src/lib/audit/log.ts`, `src/lib/admin/logAdminAction.ts`
- **Risk**: Low — additive, old functions become thin wrappers
- **Test**: Audit log entries appear correctly after admin actions.

**TASK C-05**: Replace all inline `audit_logs` inserts with `logAudit()` calls
- **Files**: `src/app/admin/actions.ts`, `src/app/admin/marketplace/actions.ts`, `src/app/admin/marketplace/orders/actions.ts`, `src/app/admin/payments/actions.ts`, `src/app/admin/jobs/actions.ts`, `src/app/admin/jobs/applicants/actions.ts`, `src/app/admin/courses/actions.ts`, `src/app/admin/creator-requests/actions.ts`
- **Risk**: Low — swap pattern, same data
- **Test**: Admin audit log page shows entries from all actions.

---

### PHASE D: Code Quality

**TASK D-01**: Extract `OrderStatusBadge` duplicate from creator dashboard
- **File**: `src/app/creator/dashboard/page.tsx`
- **Risk**: Very low — import existing component, remove local definition
- **Test**: Creator dashboard renders order status badges correctly.

**TASK D-02**: Extract `MetricCard` and `Panel` from creator dashboard to shared components
- **Files**: New `src/components/creator/DashboardCard.tsx`, update `src/app/creator/dashboard/page.tsx`
- **Risk**: Low — component extraction
- **Test**: Creator dashboard renders metrics correctly.

**TASK D-03**: Replace `alert()` in `BuyButton` with inline error/success state
- **File**: `src/components/marketplace/BuyButton.tsx`
- **Risk**: Low — UI only, no business logic
- **Test**: Buy item → success message inline. Buy unavailable item → inline error.

**TASK D-04**: Add user-facing message when avatar is required for profile completeness
- **Files**: `src/lib/profile/isProfileComplete.ts`, profile form/page
- **Risk**: Low — additive UI feedback
- **Test**: Fill out profile without avatar → clear message shows "Avatar required to complete profile".

**TASK D-05**: Add root-level `src/app/error.tsx` and `src/app/not-found.tsx`
- **Files**: New `src/app/error.tsx`, `src/app/not-found.tsx`
- **Risk**: Very low — additive
- **Test**: Navigate to `/nonexistent-route` → custom 404 page. Force a server component error → custom error page.

**TASK D-06**: Add `loading.tsx` to key pages (marketplace, courses, notifications, creator dashboard)
- **Files**: New `loading.tsx` in each directory
- **Risk**: Very low — additive
- **Test**: Slow network → skeleton loading states appear.

**TASK D-07**: Fix `NotificationsLiveClient` channel cleanup on unmount
- **File**: `src/app/notifications/NotificationsLiveClient.tsx`
- **Risk**: Low — add `return () => channel.unsubscribe()` in useEffect
- **Test**: Mount/unmount notifications page — no duplicate channel subscriptions in console.

**TASK D-08**: Extract notification data fetching into `src/lib/services/notifications.ts`
- **Files**: New `src/lib/services/notifications.ts`, refactor `src/app/notifications/page.tsx`
- **Risk**: Low — pure extraction, no behavior change
- **Test**: Notifications page still shows all notifications for all roles.

---

### PHASE E: Performance

**TASK E-01**: Remove `force-dynamic` from root layout
- **File**: `src/app/layout.tsx`
- **Risk**: Medium — must verify all auth-dependent pages still work
- **Test**: Public pages (courses, jobs, marketplace list) serve from cache. Dashboard still SSRs.

**TASK E-02**: Add `export const dynamic = "force-dynamic"` to protected pages that need it
- **Files**: `src/app/notifications/page.tsx`, `src/app/profile/page.tsx`, `src/app/creator/dashboard/page.tsx`, `src/app/admin/dashboard/page.tsx`
- **Risk**: Low — explicit per-page setting
- **Test**: Each protected page SSRs correctly. Public pages cache.

---

### PHASE F: Production Hardening

**TASK F-01**: Create `src/lib/env.ts` for startup environment validation
- **File**: New `src/lib/env.ts`
- **Risk**: Very low — additive
- **Test**: Remove a required env var → app throws clear error on startup.

**TASK F-02**: Create `src/lib/logger.ts` for structured server-side error logging
- **File**: New `src/lib/logger.ts`
- **Risk**: Very low — additive
- **Test**: Server action error → structured log output in console.

**TASK F-03**: Add `/api/health` route with version and status
- **File**: New `src/app/api/health/route.ts`
- **Risk**: Very low — additive
- **Test**: GET `/api/health` → `{ status: "ok", version: "1.0.0" }`.

---

## PHASE 6 — EXECUTION COMMANDS FOR CLAUDE CODE

> Copy-paste ready. One task per command. Execute in order.
> ⚠️ Do NOT start the next command until the previous one passes TypeScript and manual test.

---

### COMMAND FOR TASK A-01
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Fix the broken middleware. The file `proxy.ts` at the project root does nothing — it is not named correctly and contains no Supabase session refresh logic. Next.js requires a file named `middleware.ts` at the root.

CONSTRAINTS:
- Do NOT modify any other files
- Do NOT change any auth logic
- Do NOT change any page behavior
- Preserve the existing `matcher` config from proxy.ts

STEPS:
1. Read the current `proxy.ts` file at the project root
2. Create a new file `middleware.ts` at the project root with the following logic:
   - Import `createServerClient` from `@supabase/ssr`
   - Import `NextResponse` from `next/server`
   - Export an async `middleware(request: NextRequest)` function
   - Inside: create a Supabase server client that reads all cookies from the request and sets all cookies on the response
   - Call `await supabase.auth.getUser()` to trigger session refresh
   - Return the response
   - Export a `config` object with the same `matcher` pattern that was in `proxy.ts`: `["/((?!_next/static|_next/image|favicon.ico).*)"]`
3. Delete `proxy.ts`
4. Run `npx tsc --noEmit` — must pass with 0 errors

OUTPUT:
BEFORE: proxy.ts (empty proxy, not used by Next.js)
AFTER: middleware.ts (proper Supabase SSR session refresh on every matching request)

TEST: Start the dev server. Log in. Open 5 different pages. Verify you remain logged in and no session errors appear in the console.
```

---

### COMMAND FOR TASK A-02
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Harden the payment webhook endpoint. Currently if `PAYMENT_WEBHOOK_SECRET` env var is not set, the webhook accepts ALL requests without authentication — a financial security hole.

CONSTRAINTS:
- Do NOT change the payload parsing logic
- Do NOT change the provider routing logic
- Do NOT change the webhook processing logic
- Only modify the authentication check at the top of the handler

STEPS:
1. Read `src/app/api/payments/webhook/route.ts`
2. Find the block:
   ```ts
   const secret = process.env.PAYMENT_WEBHOOK_SECRET;
   if (secret) {
     const incoming = request.headers.get("x-hustleclub-webhook-secret");
     if (incoming !== secret) {
       return NextResponse.json({ error: "Unauthorized webhook request" }, { status: 401 });
     }
   }
   ```
3. Replace it with a version that ALWAYS requires the secret — if the env var is not set, log a warning and still reject unauthenticated requests OR throw a startup error
   - Recommended approach: if no secret is set in production (`NODE_ENV === "production"`), throw an error. In development, log a console.warn but allow through (for mock provider testing).
4. Run `npx tsc --noEmit` — must pass

OUTPUT:
BEFORE: Webhook auth skipped if PAYMENT_WEBHOOK_SECRET not set
AFTER: Webhook always requires authentication in production; warns in development

TEST:
- POST to /api/payments/webhook with no secret header → 401
- POST with wrong secret → 401
- POST with correct secret → processes normally
```

---

### COMMAND FOR TASK A-03
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Add proper authorization to the `updateApplicationStatus` server action in `src/lib/jobs/applicantActions.ts`. This server action currently has NO auth check — it creates a Supabase client and updates the DB directly, relying solely on RLS.

CONSTRAINTS:
- Do NOT change the function signature (same parameters: applicationId: string, status)
- Do NOT remove the existing Supabase update logic
- Only ADD auth verification at the top of the function
- The function should verify: (1) caller is authenticated, (2) caller is a creator, (3) the job_application's job belongs to the calling creator

STEPS:
1. Read `src/lib/jobs/applicantActions.ts`
2. Read `src/lib/supabase/auth.ts` to understand requireCreator
3. Add to `updateApplicationStatus`:
   a. Call `requireCreator()` (import from `@/lib/supabase/auth`) — throws if not creator
   b. After getting the creator's user, query `job_applications` JOIN `jobs` to verify that the job's `creator_id` matches `creator.id`
   c. If the application doesn't exist or belongs to a different creator, throw new Error("Unauthorized")
   d. Only then proceed with the status update
4. Run `npx tsc --noEmit`

OUTPUT:
BEFORE: No auth check, anyone with server access can update any application
AFTER: Only authenticated creators who own the job can update its applications

TEST:
- Call as non-authenticated user → error
- Call as creator who owns the job → succeeds
- Call as different creator (doesn't own the job) → "Unauthorized" error
```

---

### COMMAND FOR TASK A-04
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Add server-side input validation to the `updateProfile` server action. Currently it writes raw FormData values directly to the DB without validation. Validators already exist in `src/lib/profile/validation.ts` but are only used client-side.

CONSTRAINTS:
- Do NOT change the function signature
- Do NOT change the auth check
- Do NOT change what fields are saved to the DB
- ADD validation before the DB write
- FIX the null username redirect bug (if username is null/empty, don't redirect to /u/null)

STEPS:
1. Read `src/actions/profile/update.ts`
2. Read `src/lib/profile/validation.ts` to understand available validators (validateUsername, validateFullName, validateBio, normalizeUsername if it exists)
3. After the auth check and before the DB update:
   a. Extract username, full_name, bio from FormData as strings (use ?? "" fallback)
   b. Trim whitespace from all values
   c. Call validateUsername(username) — if it returns an error string, return { error: ... } or throw
   d. Call validateFullName(fullName) — same
   e. Call validateBio(bio) — same
   f. Check: if username is empty/null after normalization, return an error instead of writing
4. Fix the success redirect: only redirect to `/u/${username}` if username is a non-empty valid string. Otherwise redirect to `/profile`.
5. Run `npx tsc --noEmit`

OUTPUT:
BEFORE: Raw FormData written to DB with no validation; null username redirects to /u/null
AFTER: Server-side validation via existing validators; safe redirect on success

TEST:
- Submit profile with empty username → validation error returned, no DB write
- Submit profile with invalid characters in username → error
- Submit valid profile → saves correctly, redirects to /u/[username]
- Submit profile without username → redirects to /profile (not /u/null)
```

---

### COMMAND FOR TASK A-05
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Fix the marketplace storage bucket RLS policies in Supabase. Currently any authenticated user can UPDATE or DELETE any other user's marketplace images. The avatars bucket correctly restricts to the owner's folder — apply the same pattern to the marketplace bucket.

CONSTRAINTS:
- Do NOT touch any application code (.ts/.tsx files)
- ONLY create a new SQL migration file
- Do NOT alter the SELECT or INSERT policies (only fix UPDATE and DELETE)
- Do NOT drop and recreate — use DROP POLICY then CREATE POLICY

STEPS:
1. Read `supabase/migrations/20260226_hustleclub_baseline.sql` — find the marketplace storage policies
2. Find the storage policies for `marketplace_update_authenticated` and `marketplace_delete_authenticated`
3. Create a new migration file: `supabase/migrations/20260319_fix_marketplace_storage_rls.sql`
4. In that file, write SQL to:
   a. DROP POLICY "marketplace_update_authenticated" ON storage.objects;
   b. DROP POLICY "marketplace_delete_authenticated" ON storage.objects;
   c. CREATE POLICY "marketplace_update_owner" ON storage.objects FOR UPDATE USING (bucket_id = 'marketplace' AND auth.role() = 'authenticated' AND split_part(name, '/', 1) = auth.uid()::text);
   d. CREATE POLICY "marketplace_delete_owner" ON storage.objects FOR DELETE USING (bucket_id = 'marketplace' AND auth.role() = 'authenticated' AND split_part(name, '/', 1) = auth.uid()::text);
5. Note: The file path for marketplace images must use `userId/filename` format (user ID as the first path segment). Confirm this matches the existing upload code before writing the migration.

OUTPUT:
BEFORE: Any authenticated user can update/delete any marketplace image
AFTER: Only the image owner (matched by folder = userId) can update/delete their images

TEST:
- Apply migration to Supabase (SQL editor)
- As user A: upload marketplace image
- As user B: attempt to delete user A's image → should get storage policy error
```

---

### COMMAND FOR TASK B-01
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Fix the TypeScript return type bug in `requireUser()`. The function currently returns `{ user, supabase } | undefined` because TypeScript doesn't know that `redirect()` inside a catch block means the function never continues. This causes callers to unsafely destructure a potentially undefined value.

CONSTRAINTS:
- Do NOT change the runtime behavior
- Do NOT change the redirect target
- ONLY fix the TypeScript types
- Apply the same fix to requireCreator.ts and requireAdmin.ts in the same pass

STEPS:
1. Read `src/lib/auth/requireUser.ts`
2. The fix: restructure the function so redirect() is called outside the try/catch, or use an explicit `never` return type annotation for the redirect branch.
   Recommended approach:
   ```ts
   import { redirect } from "next/navigation";
   import { requireUser as requireSupabaseUser } from "@/lib/supabase/auth";

   export async function requireUser() {
     const result = await requireSupabaseUser().catch(() => null);
     if (!result) redirect("/login");
     return result; // TypeScript now knows result is non-null here
   }
   ```
   This pattern works because `redirect()` throws a Next.js NEXT_REDIRECT error, so TypeScript's control flow analysis recognizes the function doesn't continue after it.
3. Apply the same fix to `requireCreator.ts` and `requireAdmin.ts`
4. Run `npx tsc --noEmit` — must pass with 0 errors and no undefined warnings on requireUser callers

OUTPUT:
BEFORE: return type `{ user, supabase } | undefined`
AFTER: return type `{ user, supabase }` (non-nullable)

TEST: `npx tsc --noEmit` passes. All pages that call requireUser() compile without needing null-checks.
```

---

### COMMAND FOR TASK B-03
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Fix the `applyToJob` function parameter type. The function currently accepts `jobId: number` but job IDs in the Supabase database are `bigint`, which can exceed JavaScript's safe integer range. The correct type is `string`.

CONSTRAINTS:
- Change the parameter type from `number` to `string`
- Find ALL callers of `applyToJob` and update them to pass a string
- Do NOT change any other logic

STEPS:
1. Read `src/actions/job-applications.ts`
2. Change `applyToJob(jobId: number)` → `applyToJob(jobId: string)`
3. Run `npx tsc --noEmit` — this will show all files where `applyToJob` is called with a number
4. For each caller: ensure the jobId is passed as a string (use `.toString()` or template literal if coming from a number source)
5. Run `npx tsc --noEmit` again — must pass with 0 errors

OUTPUT:
BEFORE: applyToJob(jobId: number)
AFTER: applyToJob(jobId: string)

TEST: `npx tsc --noEmit` passes. Apply to a job still works end-to-end.
```

---

### COMMAND FOR TASK C-01
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Extract the `Role` type into a single source of truth at `src/types/index.ts` and remove all duplicate local declarations.

CONSTRAINTS:
- Do NOT change the Role type definition (keep as "user" | "creator" | "admin")
- Do NOT change any business logic
- Only change type declarations and imports

STEPS:
1. Check if `src/types/index.ts` exists. If not, create it.
2. Add to `src/types/index.ts`:
   ```ts
   export type Role = "user" | "creator" | "admin";
   ```
3. Find all files that declare `type Role` locally — these are at minimum:
   - `src/app/admin/users/page.tsx`
   - `src/app/dashboard/page.tsx`
   - `src/app/notifications/page.tsx`
   - `src/app/notifications/NotificationsLiveClient.tsx`
   - `src/components/admin/RoleSwitcher.tsx`
   - `src/components/navigation/Navbar.tsx`
   - `src/lib/auth/requireRole.ts`
   Run: `grep -rn "type Role" src/` to find all of them.
4. In each file: remove the local `type Role = ...` declaration and add `import { Role } from "@/types"` at the top.
5. Run `npx tsc --noEmit` — must pass.

OUTPUT:
BEFORE: type Role declared in 7+ files
AFTER: type Role declared once in src/types/index.ts, imported everywhere

TEST: `npx tsc --noEmit` passes. No local Role type declarations remain (verify with grep).
```

---

### COMMAND FOR TASK C-02
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Consolidate the 3 duplicate impersonation implementations into a single canonical module. This is a high-risk task — follow the steps exactly and do not skip the grep verification.

CONSTRAINTS:
- Do NOT change the impersonation behavior (same cookie name, same httpOnly settings)
- Do NOT change the function signatures
- Complete the consolidation in one atomic commit
- VERIFY all import sites before deleting any file

STEPS:
1. Read ALL impersonation files:
   - `src/lib/admin/impersonation.ts`
   - `src/lib/admin/impersonation.actions.ts`
   - `src/lib/admin/impersonation/actions.ts`
   - `src/lib/admin/impersonation/helpers.ts`
   - `src/lib/admin/impersonation.constants.ts`
   - `src/lib/admin/impersonation/constants.ts`
2. The canonical version to KEEP is `src/lib/admin/impersonation.ts` — it imports from `@/lib/supabase/auth` (correct path) and has "use server" at the top.
3. Run these greps to find all import sites:
   - `grep -rn "impersonation" src/ --include="*.ts" --include="*.tsx"`
   - `grep -rn "impersonation" src/ --include="*.ts" --include="*.tsx" | grep -v "lib/admin/impersonation"`
4. For each file that imports from the OLD impersonation paths:
   - Update the import to point to `@/lib/admin/impersonation` (the canonical file)
5. Run `npx tsc --noEmit` — must pass BEFORE deleting anything
6. Delete these files:
   - `src/lib/admin/impersonation.actions.ts`
   - `src/lib/admin/impersonation/actions.ts`
   - `src/lib/admin/impersonation/helpers.ts`
   - `src/lib/admin/impersonation.constants.ts`
   - `src/lib/admin/impersonation/constants.ts`
   - Delete the `src/lib/admin/impersonation/` directory if now empty
7. Run `npx tsc --noEmit` again — must still pass.

OUTPUT:
BEFORE: 3 implementations, 6 files, 2 IMPERSONATE_COOKIE constants
AFTER: 1 implementation in `lib/admin/impersonation.ts`, 1 constant

TEST: Admin impersonation start works. Stop impersonation works. `npx tsc --noEmit` passes.
```

---

### COMMAND FOR TASK C-03
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Fix the inconsistent import path in `src/actions/jobs.ts`. This file uses a relative import `"../lib/supabase/auth"` while all other action files use the path alias `"@/lib/supabase/auth"`.

CONSTRAINTS:
- Change ONLY the import path on the affected line
- Do NOT change any other code

STEPS:
1. Read `src/actions/jobs.ts`
2. Find: `import { requireCreator } from "../lib/supabase/auth"`
3. Replace with: `import { requireCreator } from "@/lib/supabase/auth"`
4. Run `npx tsc --noEmit` — must pass.

OUTPUT:
BEFORE: import from "../lib/supabase/auth"
AFTER: import from "@/lib/supabase/auth"

TEST: `npx tsc --noEmit` passes. Job creation still works.
```

---

### COMMAND FOR TASK C-04
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Create a canonical audit logging function at `src/lib/db/audit.ts` that consolidates `logAuditEvent` and `logAdminAction` into one function writing to one table (`audit_logs`).

CONSTRAINTS:
- Write to `audit_logs` table only (NOT admin_audit_logs)
- Keep the existing function names as re-exports pointing to the new canonical function (for backward compatibility during transition)
- Do NOT change any action files in this task — that's Task C-05
- Add a `source` field to differentiate admin vs. system events

STEPS:
1. Read `src/lib/audit/log.ts` and `src/lib/admin/logAdminAction.ts` to understand current schemas
2. Create `src/lib/db/audit.ts` with:
   ```ts
   import { createSupabaseAdminClient } from "@/lib/supabase/admin";

   export interface AuditInput {
     actor_id: string;
     action: string;
     target_type?: string;
     target_id?: string;
     metadata?: Record<string, unknown>;
     source?: "user" | "admin" | "system";
   }

   export async function logAudit(input: AuditInput): Promise<void> {
     const supabase = createSupabaseAdminClient();
     await supabase.from("audit_logs").insert({
       actor_id: input.actor_id,
       action: input.action,
       target_type: input.target_type ?? null,
       target_id: input.target_id ?? null,
       metadata: input.metadata ?? {},
     });
     // Note: errors are silently swallowed — audit logging must never crash the app
   }
   ```
3. Update `src/lib/audit/log.ts` → make `logAuditEvent` call `logAudit` internally
4. Update `src/lib/admin/logAdminAction.ts` → make `logAdminAction` call `logAudit` internally
5. Run `npx tsc --noEmit` — must pass.

OUTPUT:
BEFORE: Two separate functions writing to two tables
AFTER: One canonical function; old functions are thin wrappers

TEST: `npx tsc --noEmit` passes. Existing audit log calls still work.
```

---

### COMMAND FOR TASK C-05
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Replace all inline `supabase.from("audit_logs").insert({...})` calls in admin action files with the canonical `logAudit()` function from `@/lib/db/audit`.

CONSTRAINTS:
- Do NOT change any other logic in the action files
- Only replace the inline audit insert patterns
- Make sure `logAudit` is imported from `@/lib/db/audit` in each file

STEPS:
1. Run: `grep -rn 'from("audit_logs").insert' src/ --include="*.ts" --include="*.tsx"` to find all callsites
2. For each callsite, replace:
   ```ts
   await supabase.from("audit_logs").insert({
     actor_id: user.id,
     action: "some_action",
     target_type: "type",
     target_id: String(id),
     metadata: { ... },
   });
   ```
   With:
   ```ts
   await logAudit({
     actor_id: user.id,
     action: "some_action",
     target_type: "type",
     target_id: String(id),
     metadata: { ... },
   });
   ```
3. Add `import { logAudit } from "@/lib/db/audit"` to each modified file
4. Run `npx tsc --noEmit` — must pass.

OUTPUT:
BEFORE: ~8 inline audit inserts spread across action files
AFTER: All audit writes go through `logAudit()`

TEST: Perform an admin action (approve creator, update user role). Check Supabase `audit_logs` table — entry should appear.
```

---

### COMMAND FOR TASK D-01
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Remove the duplicate `OrderStatusBadge` component from the creator dashboard page and use the existing one from `src/components/marketplace/OrderStatusBadge.tsx`.

CONSTRAINTS:
- Do NOT modify `src/components/marketplace/OrderStatusBadge.tsx`
- Only modify `src/app/creator/dashboard/page.tsx`

STEPS:
1. Read `src/app/creator/dashboard/page.tsx` — find the local OrderStatusBadge definition
2. Read `src/components/marketplace/OrderStatusBadge.tsx` — note its props interface
3. Remove the local OrderStatusBadge function from the dashboard page
4. Add: `import { OrderStatusBadge } from "@/components/marketplace/OrderStatusBadge"`
5. Ensure the props passed to OrderStatusBadge match the imported component's interface
6. Run `npx tsc --noEmit` — must pass.

OUTPUT:
BEFORE: OrderStatusBadge defined locally in dashboard page (duplicate)
AFTER: OrderStatusBadge imported from shared components

TEST: Creator dashboard renders order status correctly. `npx tsc --noEmit` passes.
```

---

### COMMAND FOR TASK D-03
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Replace the `alert()` calls in `BuyButton.tsx` with inline UI state (error message / success message rendered in the component).

CONSTRAINTS:
- Keep ALL existing business logic (idempotency key, createOrder call, error handling)
- ONLY change how errors and success messages are displayed
- Use a simple `useState` for error/success message strings
- Do NOT add external UI libraries

STEPS:
1. Read `src/components/marketplace/BuyButton.tsx`
2. Add state: `const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)`
3. Replace `alert(checkout?.message ?? "Payment checkout created")` with `setMessage({ type: "success", text: checkout?.message ?? "Order created successfully" })`
4. Replace `alert(getErrorMessage(error))` with `setMessage({ type: "error", text: getErrorMessage(error) })`
5. Render below the button:
   ```tsx
   {message && (
     <p className={message.type === "error" ? "text-red-500 text-sm mt-2" : "text-green-600 text-sm mt-2"}>
       {message.text}
     </p>
   )}
   ```
6. Clear message when buy is clicked again: `setMessage(null)` at start of handler
7. Run `npx tsc --noEmit` — must pass.

OUTPUT:
BEFORE: alert() dialog on success and error
AFTER: Inline styled message below button

TEST: Click buy on a marketplace item → success message appears inline. Click buy when already sold → error message appears inline. No alert() dialogs anywhere.
```

---

### COMMAND FOR TASK D-05
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Add root-level `error.tsx` and `not-found.tsx` to the Next.js app directory for proper error handling and custom 404 pages.

CONSTRAINTS:
- `error.tsx` must be a "use client" component (Next.js requirement for error boundaries)
- Keep styling consistent with the existing app (use Tailwind classes that match the existing design)
- Do NOT break any existing pages

STEPS:
1. Look at the existing app design in a few pages to understand the Tailwind class patterns used
2. Create `src/app/error.tsx`:
   ```tsx
   "use client";
   import { useEffect } from "react";

   export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
     useEffect(() => {
       console.error(error);
     }, [error]);

     return (
       <div className="min-h-screen flex flex-col items-center justify-center gap-4">
         <h2 className="text-xl font-semibold">Something went wrong</h2>
         <p className="text-muted-foreground text-sm">An unexpected error occurred. Please try again.</p>
         <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
           Try again
         </button>
       </div>
     );
   }
   ```
3. Create `src/app/not-found.tsx`:
   ```tsx
   import Link from "next/link";

   export default function NotFound() {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center gap-4">
         <h2 className="text-xl font-semibold">Page not found</h2>
         <p className="text-muted-foreground text-sm">The page you're looking for doesn't exist.</p>
         <Link href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
           Go home
         </Link>
       </div>
     );
   }
   ```
4. Run `npx tsc --noEmit` — must pass.

OUTPUT:
BEFORE: Default Next.js error page and 404
AFTER: Custom branded error and 404 pages

TEST: Navigate to /nonexistent-route → custom 404 page. Dev: trigger a server error → custom error page with reset button.
```

---

### COMMAND FOR TASK E-01 + E-02 (Do Together)
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Remove `force-dynamic` from the root layout (which forces ALL pages into SSR) and instead add it explicitly only to pages that genuinely require fresh server-side data on every request.

CONSTRAINTS:
- This is a high-attention task — test EVERY type of page after the change
- Do NOT remove force-dynamic from auth-dependent pages
- Only public browsing pages (courses list, jobs list, marketplace list, homepage) should potentially be static

STEPS:
1. Read `src/app/layout.tsx` — remove these two lines:
   ```ts
   export const dynamic = "force-dynamic";
   export const revalidate = 0;
   ```
2. Add `export const dynamic = "force-dynamic"` to these pages (they need fresh data per-request):
   - `src/app/notifications/page.tsx`
   - `src/app/creator/dashboard/page.tsx`
   - `src/app/creator/analytics/page.tsx`
   - `src/app/admin/dashboard/page.tsx`
   - `src/app/admin/analytics/page.tsx`
   - `src/app/dashboard/page.tsx`
   - `src/app/profile/page.tsx` (if it exists)
   - `src/app/marketplace/orders/page.tsx`
3. Run `npx tsc --noEmit` — must pass.
4. Start dev server. Test EVERY page type:
   - Homepage, courses list, jobs list, marketplace list (should now be potentially cacheable)
   - Dashboard, notifications, creator pages (should still SSR)
   - Admin pages (should still SSR)
   - Auth pages (login, signup — must still work)

OUTPUT:
BEFORE: force-dynamic on root layout — ALL pages SSR
AFTER: force-dynamic only on pages that need it — public pages can be cached

TEST: All pages load correctly. Auth-dependent pages show correct user data. Public pages serve HTML without session dependency.
```

---

### COMMAND FOR TASK F-01
```
ROLE: You are an execution agent inside VS Code working on the HustleClub Next.js 16 + Supabase project.

TASK: Create `src/lib/env.ts` that validates all required environment variables at startup and provides typed access to them throughout the app.

CONSTRAINTS:
- Do NOT change any existing imports yet — just create the file
- The validation should throw a clear error in production if vars are missing
- In development, it should warn but allow fallbacks where safe

STEPS:
1. Create `src/lib/env.ts`:
   ```ts
   function requireEnv(name: string): string {
     const value = process.env[name];
     if (!value) {
       if (process.env.NODE_ENV === "production") {
         throw new Error(`[HustleClub] Missing required environment variable: ${name}`);
       }
       console.warn(`[HustleClub] Warning: ${name} is not set`);
       return "";
     }
     return value;
   }

   export const env = {
     supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
     supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
     supabaseServiceKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
     siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
     paymentProvider: (process.env.PAYMENT_PROVIDER ?? "mock") as "mock" | "stripe" | "razorpay",
     paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
   } as const;
   ```
2. Run `npx tsc --noEmit` — must pass.

OUTPUT:
BEFORE: process.env.XYZ accessed inline throughout codebase with no validation
AFTER: Centralized env object with startup validation

TEST: Remove NEXT_PUBLIC_SUPABASE_URL from .env.local, start server — should see clear error message. Restore and confirm startup works normally.
```

---

## EXECUTION CHECKLIST

### Before Starting ANY Task
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `git status` is clean (all work committed)
- [ ] You have identified which exact files will be touched

### After Completing ANY Task
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] Manual test of the affected feature passes
- [ ] No new console errors in browser
- [ ] `git commit -m "fix: [task id] [description]"`

### Definition of Done for Each Phase
- **Phase A**: No auth holes. Webhook requires secret. Middleware refreshes sessions. Storage locked to owners.
- **Phase B**: Zero TypeScript undefined return type issues. `npx tsc --noEmit` clean.
- **Phase C**: Zero duplicate implementations. All imports use canonical paths.
- **Phase D**: No `alert()` calls. Custom error/404 pages exist. Notifications page under 50 lines.
- **Phase E**: Root layout has no `force-dynamic`. Public pages can be cached.
- **Phase F**: Missing env vars produce clear startup errors. Health endpoint exists.

---

## QUICK REFERENCE — ISSUE → TASK MAPPING

| Issue | Severity | Task | Phase |
|---|---|---|---|
| Broken middleware (no session refresh) | 🔴 Critical | A-01 | A |
| Webhook secret bypass | 🔴 Critical | A-02 | A |
| `updateApplicationStatus` no auth | 🔴 Critical | A-03 | A |
| `updateProfile` no validation | 🔴 Critical | A-04 | A |
| Marketplace storage RLS too permissive | 🔴 Critical | A-05 | A |
| `requireUser()` returns undefined | 🟠 High | B-01 | B |
| `applyToJob` takes number not string | 🟡 Medium | B-03 | B |
| Impersonation duplicated 3x | 🟠 High | C-02 | C |
| Role type declared in 7+ files | 🟠 High | C-01 | C |
| Two audit log tables | 🟠 High | C-04, C-05 | C |
| Relative import in jobs.ts | 🔵 Low | C-03 | C |
| force-dynamic on root layout | 🟠 High | E-01, E-02 | E |
| No error.tsx / not-found.tsx | 🟡 Medium | D-05 | D |
| BuyButton uses alert() | 🟡 Medium | D-03 | D |
| OrderStatusBadge duplicate | 🟡 Medium | D-01 | D |
| isProfileComplete avatar UX | 🟡 Medium | D-04 | D |
| No loading.tsx files | 🟡 Medium | D-06 | D |
| Notification realtime cleanup | 🟡 Medium | D-07 | D |
| 280-line notifications God Component | 🟡 Medium | D-08 | D |
| Webhook secret env validation | 🟠 High | F-01 | F |

---

*HustleClub — Master Execution Plan v1.0 | March 2026*
*Brain: Claude Cowork | Executor: Claude Code*
