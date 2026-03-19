# HustleClub — Professional Engineering Audit
### Prepared by: Senior Architect Review | March 2026

---

## Table of Contents

1. [System Breakdown](#1-system-breakdown)
2. [File Structure Review](#2-file-structure-review)
3. [Problems Detected](#3-problems-detected)
4. [New Architecture Design](#4-new-architecture-design)
5. [Ideal Folder Structure](#5-ideal-folder-structure)
6. [Before vs After Mapping](#6-before-vs-after-mapping)
7. [Safe Refactor Strategy](#7-safe-refactor-strategy)
8. [Code Improvement Plan](#8-code-improvement-plan)
9. [Production-Grade Upgrades](#9-production-grade-upgrades)
10. [How Top Engineers Think](#10-how-top-engineers-think)

---

## 1. System Breakdown

### What This Project Does

HustleClub is a **multi-sided creator economy platform** targeted at India. It combines three revenue channels — **courses**, **UGC gig jobs**, and a **thrift/digital marketplace** — with a tiered role system (user → creator → admin) in a single Next.js 16 + Supabase application.

---

### Core Modules and Their Roles

| Module | Location | Responsibility |
|---|---|---|
| **Auth** | `src/lib/supabase/auth.ts` | Session resolution, role checking, impersonation overlay |
| **Auth Guards** | `src/lib/auth/` | Page-level redirect wrappers (requireUser, requireCreator, requireAdmin) |
| **Supabase Clients** | `src/lib/supabase/` | Server client (SSR cookie-aware), browser client (singleton), admin client (service role) |
| **Payment Service** | `src/lib/payments/service.ts` | Full idempotent checkout state machine (created → processing → succeeded/failed) |
| **Payment State** | `src/lib/payments/state.ts` | FSM constants, transition validation, idempotency key validation |
| **Notifications** | `src/app/notifications/` | Role-aware multi-table query → real-time Supabase channel refresh |
| **Admin** | `src/app/admin/` | Platform-wide moderation, creator approval, audit logs, impersonation |
| **Creator** | `src/app/creator/` | Dashboard, jobs CRUD, courses CRUD, marketplace items, analytics |
| **Profile** | `src/lib/profile/` | Completeness check, validation helpers |
| **Audit Logging** | `src/lib/audit/log.ts` | Structured action logging to `audit_logs` table |
| **Impersonation** | `src/lib/admin/impersonation*` | Admin-to-user session overlay via httpOnly cookie |
| **Database Schema** | `supabase/migrations/` | Baseline schema, RLS policies, payment tables, realtime config |
| **Navigation** | `src/components/navigation/Navbar.tsx` | Server-rendered role-aware nav hydrated to client |

---

### Data Flow (Step-by-Step)

```
1. REQUEST HITS NEXT.JS
   └── RootLayout runs on server
       └── createSupabaseServerClient() reads SSR cookies
           └── supabase.auth.getUser() → user
               └── profiles table query → role
                   └── Navbar(user, role) rendered server-side
                       └── Client receives hydrated HTML

2. PAGE LOAD (Protected Route)
   └── requireUser/requireCreator/requireAdmin called in page.tsx
       └── Reads impersonation cookie (httpOnly)
           └── If impersonating: swaps user.id → impersonatedUserId
               └── All subsequent DB queries run as impersonated user
                   └── RLS policies enforce at DB level

3. USER ACTION (e.g. buy item)
   └── BuyButton client component
       └── sessionStorage idempotency key generated
           └── createOrder() server action called
               └── requireUser() validates session
                   └── startMarketplaceCheckoutForItem()
                       └── Admin client bypasses RLS
                           └── Checks item availability
                               └── Finds/creates payment_transaction
                                   └── Runs provider checkout
                                       └── On success → finalizeMarketplacePaymentTransaction()
                                           └── Locks item (is_sold=true)
                                               └── Creates marketplace_order
                                                   └── Updates transaction status
                                                       └── revalidatePath() → SSR refetch

4. WEBHOOK (async payment confirmation)
   └── POST /api/payments/webhook
       └── Validates x-hustleclub-webhook-secret header
           └── Persists event to payment_webhook_events (deduplication)
               └── processPaymentWebhookEvent()
                   └── Routes to provider handler
                       └── finalizeMarketplacePaymentTransaction()
```

---

## 2. File Structure Review

### Current Structure

```
/
├── src/
│   ├── actions/                   ← Server actions (mixed location)
│   │   ├── courses.ts
│   │   ├── job-applications.ts
│   │   ├── jobs.ts
│   │   └── profile/update.ts
│   ├── app/
│   │   ├── (auth)/login, signup, signout
│   │   ├── (dashboard)/
│   │   ├── admin/                 ← Admin sub-system (well scoped)
│   │   ├── api/                   ← API routes
│   │   ├── creator/               ← Creator sub-system
│   │   ├── marketplace/           ← Marketplace pages
│   │   ├── jobs/                  ← Jobs pages
│   │   ├── courses/
│   │   ├── notifications/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── admin/
│   │   ├── applications/
│   │   ├── creator/
│   │   ├── dashboard/
│   │   ├── jobs/
│   │   ├── marketplace/
│   │   ├── navigation/
│   │   ├── profile/
│   │   └── ui/
│   ├── lib/
│   │   ├── admin/                 ← DUPLICATE: 3 versions of impersonation
│   │   ├── audit/
│   │   ├── auth/                  ← Thin wrappers around supabase/auth.ts
│   │   ├── constants.ts
│   │   ├── creator/
│   │   ├── hooks/
│   │   ├── jobs/
│   │   ├── notifications/
│   │   ├── payments/
│   │   ├── profile/
│   │   └── supabase/              ← Core Supabase clients + auth logic
│   └── globals.css
├── supabase/migrations/
├── types/
└── proxy.ts                       ← Empty proxy (no cookie refresh logic)
```

### What's Good

- The **Next.js App Router** structure is correct — `(auth)` route groups, dynamic segments, co-located `actions.ts` files alongside pages are all solid patterns.
- **Supabase layer separation** (server.ts, client.ts, admin.ts) is clean and intentional.
- The `payments/` module is **production-grade** — proper FSM, idempotency, webhook deduplication. This is the best-written part of the codebase.
- **RLS policies in the database** are comprehensive and well-thought-out — enforced at the data layer, not just application code.
- The `notifications/` module uses real Supabase realtime channels correctly.
- **Test coverage exists** for the right things: pure functions (payment state machine, profile validation, notification helpers).

### What's Risky

- The **impersonation system is duplicated 3 times** across different directories.
- The `proxy.ts` file does nothing — it's a shell with no middleware logic (no cookie refresh).
- Server actions are split between `src/actions/` and co-located `src/app/**/actions.ts` — no single convention.
- The `Role` type is re-declared in at least 5 different files instead of coming from a central types file.
- Two separate audit log tables (`audit_logs` and `admin_audit_logs`) serve the same purpose with the same schema.
- The `listings` table in the DB appears to be a stub with no application code behind it.

---

## 3. Problems Detected

### Architecture Flaws

**1. The proxy.ts is broken/empty**
```ts
// proxy.ts — current (does nothing)
export function proxy() {
  return NextResponse.next();
}
```
This file is named `proxy.ts` but is not being used as a Next.js middleware (`middleware.ts`). Without real middleware, the Supabase session cookie is **never refreshed on the server**. This means sessions can expire silently mid-browsing. The `@supabase/ssr` docs require middleware that calls `supabase.auth.getUser()` and writes updated cookie tokens on every request.

**2. Duplicated Impersonation System (3 copies)**
Three implementations of the exact same functionality exist simultaneously:

- `src/lib/admin/impersonation.ts` — "use server" version with `requireAdmin()` from `@/lib/supabase/auth`
- `src/lib/admin/impersonation.actions.ts` — same logic, uses `@/lib/supabase/auth`, has doc comments
- `src/lib/admin/impersonation/actions.ts` — same logic again, uses `@/lib/auth` (different import path!)
- `src/lib/admin/impersonation/helpers.ts` — getImpersonatedUserId in its own file
- `src/lib/admin/impersonation.constants.ts` — IMPERSONATE_COOKIE constant
- `src/lib/admin/impersonation/constants.ts` — same constant again

This means 2 separate `IMPERSONATE_COOKIE` constants and 3 separate `startImpersonation` functions exist. This is a refactoring accident that wasn't cleaned up. If one is changed, the others silently diverge.

**3. Two Audit Log Tables with Identical Schemas**
`audit_logs` and `admin_audit_logs` both have `actor_id, action, target_type, target_id, metadata, created_at`. Two different application functions (`logAdminAction` in `src/lib/admin/` and `logAuditEvent` in `src/lib/audit/`) write to each. But the action code (`src/app/admin/actions.ts`, `payments/actions.ts`, etc.) writes **directly** to `audit_logs` via inline Supabase calls — bypassing both helper functions entirely. This means the helper functions are largely unused and the table split serves no architectural purpose.

**4. requireUser() has a TypeScript silent failure**
```ts
// src/lib/auth/requireUser.ts
export async function requireUser() {
  try {
    const { user, supabase } = await requireSupabaseUser();
    return { user, supabase };
  } catch {
    redirect("/login");
  }
}
```
This function's return type is inferred as `{ user, supabase } | undefined`. After the `redirect()`, TypeScript doesn't know the function never continues — so callers must handle `undefined` or use non-null assertions. The correct pattern is to use `redirect()` as a thrown value (which Next.js does handle) and not use try/catch around it.

**5. updateApplicationStatus has no authorization check**
```ts
// src/lib/jobs/applicantActions.ts
export async function updateApplicationStatus(applicationId, status) {
  const supabase = await createSupabaseServerClient();
  // No auth check — who can call this?
  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId);
}
```
This server action creates a Supabase client but never calls `requireUser()`, `requireCreator()`, or any auth guard. It relies entirely on RLS — which is good — but the application layer offers no clarity on who is authorized to call this, and there's no audit trail.

**6. updateProfile bypasses the validation layer**
```ts
// src/actions/profile/update.ts
export async function updateProfile(formData: FormData) {
  // ...auth check...
  await supabase.from("profiles").update({
    username: formData.get("username"),  // No validateUsername() called
    full_name: formData.get("full_name"), // No validateFullName() called
    bio: formData.get("bio"),            // No validateBio() called
  }).eq("id", user.id);
}
```
The `ProfileForm.tsx` client component does validate before calling the Supabase client directly. But `src/actions/profile/update.ts` (a separate path) does **zero validation** before writing to the DB. Validation logic exists in `src/lib/profile/validation.ts` but is only used in the client component, not in the server action. Any client bypassing the form (e.g., a direct POST) gets raw, unvalidated writes.

---

### Code Smells

**7. Role type redeclared in 5+ files**
```ts
// Re-declared in: Navbar.tsx, notifications/page.tsx,
// creator/dashboard/page.tsx, lib/auth/requireRole.ts, lib/supabase/auth.ts
type Role = "user" | "creator" | "admin";
```
It should live once in `types/` and be imported everywhere.

**8. Inline audit_logs inserts instead of using the helper**
```ts
// In admin/actions.ts, payments/actions.ts, jobs/actions.ts, etc.
await supabase.from("audit_logs").insert({
  actor_id: user.id,
  action: "admin_update_user_role",
  // ... repeated pattern everywhere
});
```
The `logAuditEvent()` helper in `src/lib/audit/log.ts` was written for exactly this, but ~80% of audit log writes bypass it and inline the Supabase insert directly. This makes it impossible to add enrichment (e.g., IP logging, timestamp normalization, event queuing) without touching every callsite.

**9. Creator dashboard has inline helper components that should be shared**
`creator/dashboard/page.tsx` defines `MetricCard`, `Panel`, and `OrderStatusBadge` as local functions. `OrderStatusBadge` is also independently defined in `src/components/marketplace/OrderStatusBadge.tsx`. Two implementations of the same component.

**10. Notifications page does too much in one server component**
`src/app/notifications/page.tsx` is 280+ lines. It fetches data for user, creator, and admin roles, builds notification arrays, deduplicates, and renders — all in one function. This is a 3-concern God Component. It should be split into a `notificationService.ts` data layer and a set of composable components.

**11. BuyButton uses `alert()` for errors**
```ts
alert(checkout?.message ?? "Payment checkout created");
alert(getErrorMessage(error));
```
`alert()` is blocking, non-dismissable without user interaction, unstyled, and unloggable. In a production app this should be a toast, inline error, or modal.

**12. Marketplace storage RLS is too permissive**
```sql
-- Any authenticated user can update/delete ANY marketplace image
create policy marketplace_update_authenticated on storage.objects
for update using (bucket_id = 'marketplace' and auth.role() = 'authenticated');
```
This means any logged-in user can overwrite or delete another user's uploaded marketplace images. The correct policy should enforce `split_part(name, '/', 1) = auth.uid()::text` as is done for `avatars`.

---

### Tight Coupling

**13. Notifications page is tightly coupled to DB schema**
If you add a new notification source, you must modify the 280-line notifications page directly. There is no registry, no hook, no abstraction — just sequential if/else branches for each data type.

**14. `requireAdmin()` opens two different Supabase connections**
```ts
// In admin/layout.tsx:
await requireAdmin();                    // Opens connection #1
const impersonatedUserId = await getImpersonatedUserId(); // Opens connection #2 (cookies only)
```
While `getImpersonatedUserId()` doesn't use Supabase (it reads a cookie), `requireAdmin()` itself creates a server client AND calls `requireUser()` which creates another server client. Every layout and page create fresh clients — there's no request-scoped client sharing.

---

### Naming Inconsistencies

| Issue | Example |
|---|---|
| Two auth namespaces | `requireUser` lives in both `lib/auth/` and `lib/supabase/auth.ts` |
| `seller_id` vs `user_id` | `marketplace_items` has both; triggers sync them — a sign of legacy rename |
| `creator_id` vs `created_by` | `jobs` table has both; triggers sync them |
| `logAdminAction` vs `logAuditEvent` | Two functions, same purpose, different tables |
| `admin_audit_logs` vs `audit_logs` | Same schema, unclear distinction |
| `proxy.ts` | Not a proxy — does nothing useful |

---

### Scalability Risks

**15. N+1 query risk in notifications**
```ts
// notifications/page.tsx
const jobIds = creatorJobsRes.data?.map(r => r.id) ?? [];
// Then:
const { data } = await supabase.from("job_applications")
  .select("...")
  .in("job_id", jobIds)  // This is fine
```
The current implementation actually avoids the N+1 by collecting IDs first — good. But it makes **5-8 separate sequential queries** for a creator, and **7-10 for an admin**. At scale, this page will be slow. The right pattern is a single Postgres view or stored procedure that returns structured notification data in one query.

**16. Admin dashboard makes 16 parallel COUNT queries**
```ts
const [usersRes, creatorsRes, pendingCreatorRes, jobsRes, openJobsRes, ...]
  = await Promise.all([16 queries]);
```
These are run in parallel which is correct, but 16 separate network round-trips per admin dashboard load is unsustainable. A single SQL query with window functions or a materialized view is the right long-term solution.

**17. No rate limiting on job applications or creator requests**
There's a DB-level unique constraint on `(job_id, applicant_id)` which prevents duplicate applications — good. But there's no application-level rate limiting on creator requests, job applications, or payment initiation. A user could hammer the checkout endpoint.

**18. `force-dynamic` on root layout disables all static optimization**
```ts
// app/layout.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
```
This is on the **root layout**, which means **every single page** in the app is forced into full server-side rendering on every request. Public pages (home, course listings, job listings) cannot be statically generated or cached. For a platform expecting Indian-scale traffic, this is a significant performance ceiling.

---

### Hidden Bugs

**19. `requireUser` in `lib/auth/requireUser.ts` can return `undefined`**
TypeScript infers the return type as `{ user, supabase } | undefined`. If a caller does:
```ts
const { user } = await requireUser();
```
This will throw a runtime destructuring error if `redirect()` is caught and the function implicitly returns `undefined`. The function should use `never` as the redirect path's return type.

**20. `isProfileComplete` requires `avatar_url` but avatar upload is optional in `ProfileForm`**
```ts
// isProfileComplete checks:
data.username && data.full_name && data.avatar_url && data.bio
```
Users are not required to upload an avatar in the profile form — it's a separate `AvatarUploader` component. A user can fill out username, full_name, and bio but with no avatar, they'll never pass `isProfileComplete` and get silently redirected away from gated pages. This creates a confusing user experience with no visible error.

**21. `createJob` in `src/actions/jobs.ts` uses a different import path than the rest**
```ts
// src/actions/jobs.ts
import { requireCreator } from "../lib/supabase/auth";   // ← relative path
// vs. everywhere else:
import { requireCreator } from "@/lib/supabase/auth";    // ← alias path
```
Minor, but reflects that this file was written at a different time or by a different approach. In a large codebase, mixing import styles causes confusion.

**22. `applyToJob` takes a `number` but job IDs in the codebase are `bigint`**
```ts
export async function applyToJob(jobId: number) { ... }
```
Postgres `bigint` columns can exceed JavaScript's safe integer range. The type should be `string` or use `BigInt`.

---

## 4. New Architecture Design

### Proposed Architecture

The architecture remains Next.js App Router + Supabase, but with cleaner layering:

```
HTTP Request
     │
     ▼
┌─────────────────────┐
│   Middleware         │  ← Cookie refresh, basic auth check, rate limiting
│   (middleware.ts)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Layout / Page      │  ← Only orchestration: call service, pass to UI
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Server Actions     │  ← Thin, auth-gated, call services only
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Services Layer     │  ← Business logic, NO Supabase clients directly
│   (lib/services/)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Repository Layer   │  ← All DB access, typed queries, no logic
│   (lib/db/)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Supabase / DB      │  ← RLS as defense-in-depth, not sole auth
└─────────────────────┘
```

### Design Principles Applied

- **Separation of Concerns**: DB queries (repository) are separate from business logic (service) which is separate from orchestration (page/action).
- **Single Responsibility**: Each file does one thing. `notificationService.ts` fetches and formats notifications. It doesn't render anything.
- **Don't Repeat Yourself (DRY)**: One `Role` type. One audit logging function. One impersonation module.
- **Defense in Depth**: RLS at the DB level PLUS auth checks at the application level. Neither alone is sufficient.
- **Fail Fast**: Auth guards throw, not silently return. TypeScript `never` enforced for unreachable paths.

---

## 5. Ideal Folder Structure

```
/src
├── middleware.ts                    ← Supabase session refresh on every request
│
├── types/
│   ├── index.ts                    ← Role, shared enums, base DB row types
│   ├── jobs.ts                     ← Job-domain types (move from /types/)
│   └── profile.ts                  ← Profile types (move from /types/)
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts               ← createSupabaseServerClient() [unchanged]
│   │   ├── client.ts               ← createSupabaseClient() [unchanged]
│   │   └── admin.ts                ← createSupabaseAdminClient() [unchanged]
│   │
│   ├── auth/
│   │   ├── session.ts              ← requireUser, requireCreator, requireAdmin
│   │   │                           ← (merge supabase/auth.ts + lib/auth/*.ts into ONE file)
│   │   └── impersonation.ts        ← Single impersonation module (delete the 3 duplicates)
│   │
│   ├── services/                   ← Business logic, no direct DB access
│   │   ├── notifications.ts        ← fetchNotifications(userId, role)
│   │   ├── profile.ts              ← isProfileComplete, updateProfile (with validation)
│   │   ├── creator-requests.ts     ← submitCreatorRequest, getCreatorRequestStatus
│   │   └── payments.ts             ← re-export from payments/service.ts (keep that file)
│   │
│   ├── db/                         ← Repository layer: pure typed DB queries
│   │   ├── jobs.ts                 ← getJobById, listJobs, createJob, etc.
│   │   ├── courses.ts              ← getCourseById, listCourses, etc.
│   │   ├── marketplace.ts          ← getItemById, listItems, etc.
│   │   ├── profiles.ts             ← getProfile, updateProfile, etc.
│   │   └── audit.ts                ← logAudit() — single function, one table
│   │
│   ├── payments/
│   │   ├── service.ts              ← [unchanged — excellent code]
│   │   └── state.ts                ← [unchanged — excellent code]
│   │
│   ├── notifications/
│   │   └── helpers.ts              ← [unchanged — good utilities]
│   │
│   ├── profile/
│   │   └── validation.ts           ← [unchanged — good validators]
│   │
│   ├── constants.ts                ← ROLES, app-wide constants [unchanged]
│   └── utils.ts                    ← cn() [unchanged]
│
├── actions/                        ← ALL server actions in ONE place (not split)
│   ├── auth.ts                     ← signup, login helpers
│   ├── jobs.ts                     ← createJob, updateJob
│   ├── courses.ts                  ← createCourse, publishCourse
│   ├── applications.ts             ← applyToJob, updateApplicationStatus
│   ├── marketplace.ts              ← publishItem, unpublishItem, deleteItem, createOrder
│   └── profile.ts                  ← updateProfile (with validation)
│
├── components/
│   ├── ui/                         ← Generic: Card, Button, Badge, Skeleton, etc.
│   ├── navigation/
│   ├── profile/
│   ├── jobs/
│   ├── courses/
│   ├── marketplace/
│   ├── creator/
│   └── admin/
│
└── app/
    ├── middleware.ts → (root level)
    ├── layout.tsx
    ├── page.tsx
    ├── (auth)/
    ├── (public)/jobs, courses, marketplace
    ├── (user)/profile, my-jobs, my-courses, marketplace/orders
    ├── creator/
    ├── admin/
    └── api/
```

### Why Each Folder Exists

- **`lib/auth/session.ts`**: One place to understand ALL auth behavior. When a junior developer asks "how does auth work?", they have one file to read.
- **`lib/db/`**: Decouples queries from logic. If Supabase is swapped for Prisma tomorrow, only this layer changes.
- **`lib/services/`**: Business logic lives here, not in pages or server actions. Pages become thin orchestrators.
- **`actions/`**: All server actions in one directory. Easy to grep, easy to audit.
- **`types/index.ts`**: Single source of truth for shared types. No more 5-file Role redeclaration.

---

## 6. Before vs After Mapping

| Old Path | New Path | Reason |
|---|---|---|
| `src/lib/supabase/auth.ts` | `src/lib/auth/session.ts` | Rename to reflect purpose, not implementation |
| `src/lib/auth/requireUser.ts` | Merged into `session.ts` | Eliminate the thin wrapper |
| `src/lib/auth/requireCreator.ts` | Merged into `session.ts` | Eliminate the thin wrapper |
| `src/lib/auth/requireAdmin.ts` | Merged into `session.ts` | Eliminate the thin wrapper |
| `src/lib/auth/requireRole.ts` | Merged into `session.ts` | Already does the same job |
| `src/lib/admin/impersonation.ts` | `src/lib/auth/impersonation.ts` | Single module, correct location |
| `src/lib/admin/impersonation.actions.ts` | **DELETED** | Duplicate |
| `src/lib/admin/impersonation/actions.ts` | **DELETED** | Duplicate |
| `src/lib/admin/impersonation/helpers.ts` | **DELETED** | Merged into single module |
| `src/lib/admin/impersonation.constants.ts` | **DELETED** | Merged into single module |
| `src/lib/admin/impersonation/constants.ts` | **DELETED** | Merged into single module |
| `src/lib/admin/logAdminAction.ts` | **DELETED** | Replaced by `lib/db/audit.ts` |
| `src/lib/audit/log.ts` | `src/lib/db/audit.ts` | Canonical location |
| `src/actions/jobs.ts` | `src/actions/jobs.ts` | Keep, fix import path |
| `src/actions/job-applications.ts` | `src/actions/applications.ts` | Rename for clarity |
| `src/actions/profile/update.ts` | `src/actions/profile.ts` | Flatten, add validation |
| Inline audit inserts in action files | Call `logAudit()` | Use the helper |
| `proxy.ts` | `middleware.ts` | Actually implement cookie refresh |
| `admin_audit_logs` table | **REMOVE** (merge into `audit_logs`) | Single audit table |
| `listings` table | **DOCUMENT/REMOVE** | Unused stub |
| Role type re-declared everywhere | `types/index.ts` | Single source |

---

## 7. Safe Refactor Strategy

> **Golden Rule**: Every step must leave the app in a working, deployable state.

### Phase 1: Eliminate Duplicates (Low Risk, High Value)
*Do this first — zero functional change, pure cleanup*

1. **Merge impersonation into one file** (`src/lib/auth/impersonation.ts`). Update all imports. Delete the 5 duplicate files.
2. **Test**: Run the app, test admin impersonation start/stop. No functional change.
3. **Merge auth guards into one file** (`src/lib/auth/session.ts` = current `supabase/auth.ts` + thin wrappers merged). Keep old files as re-exports pointing to new location during transition.
4. **Test**: All protected pages still redirect correctly.
5. **Extract Role type** to `src/types/index.ts`. Find-and-replace all re-declarations.
6. **Test**: TypeScript build passes (`npx tsc --noEmit`).

### Phase 2: Fix the Middleware (Critical Bug Fix)
*This is a correctness fix, not a refactor*

1. **Rename** `proxy.ts` to `middleware.ts` (Next.js convention).
2. **Implement** proper Supabase session refresh per `@supabase/ssr` docs:
   ```ts
   // middleware.ts
   import { createServerClient } from "@supabase/ssr";
   import { NextResponse } from "next/server";

   export async function middleware(request) {
     let response = NextResponse.next({ request });
     const supabase = createServerClient(url, key, {
       cookies: {
         getAll() { return request.cookies.getAll(); },
         setAll(cookiesToSet) {
           cookiesToSet.forEach(({ name, value, options }) => {
             response.cookies.set(name, value, options);
           });
         },
       },
     });
     await supabase.auth.getUser(); // Refreshes session
     return response;
   }
   export const config = { matcher: [...] };
   ```
3. **Test**: Log in, wait for session expiry window, confirm session stays alive.

### Phase 3: Fix Authorization Holes (Security)
*These are security fixes — do before any public launch*

1. **Add auth to `updateApplicationStatus`**: Add `requireCreator()` check + ownership validation (verify the job belongs to the calling creator).
2. **Add validation to `updateProfile` server action**: Call `validateUsername()`, `validateFullName()`, `validateBio()` before writing to DB.
3. **Fix marketplace storage policy**: Add `split_part(name, '/', 1) = auth.uid()::text` to update/delete policies.
4. **Test each**: Try invalid inputs, unauthorized access from different users.

### Phase 4: Consolidate Audit Logging (Maintainability)
*Do after Phase 1 — low risk but needs coordination*

1. **Choose one table**: Use `audit_logs`. Migrate any `admin_audit_logs` data if needed.
2. **Create `logAudit(input: LogInput)`** in `src/lib/db/audit.ts` as the canonical function.
3. **Replace all inline `supabase.from("audit_logs").insert({...})`** calls in action files with `await logAudit({...})`. There are ~8 callsites.
4. **Test**: Admin audit logs page shows entries from all actions.

### Phase 5: Static Optimization (Performance)
*Only do this after the app is stable*

1. **Remove `force-dynamic` from root layout**. Instead, add it only to pages that need it (profile, dashboard, notifications).
2. **Add `export const dynamic = "force-static"` or use `generateStaticParams`** for public listing pages (courses, jobs, marketplace).
3. **Test**: Public pages serve cached HTML. Authenticated pages still SSR.

### Backup Strategy
- Use `git` — commit a clean state before each phase.
- Run `npx tsc --noEmit` after each phase to catch type errors before deployment.
- Keep old import paths as re-exports during transition to avoid breaking everything at once.

---

## 8. Code Improvement Plan

### `src/lib/supabase/auth.ts` — Session Resolution

**What's wrong**: The function names `requireUser`, `requireCreator`, `requireAdmin` exist in two layers — this file and `src/lib/auth/*.ts` — creating confusion about which to import.

**What to improve**:
- This file is the single source of truth. The `src/lib/auth/` wrappers should be eliminated.
- The `requireUser` function swaps `user.id` with impersonated ID — a critical behavior that's invisible from the function name. Rename or add a JSDoc comment explaining this.
- Return types should be explicitly declared, not inferred.

**Clean approach**: Merge both layers. Export `getAuthSession()` (no redirect) and `requireSession()` (redirects). Name the redirect destination explicitly.

---

### `src/app/notifications/page.tsx` — God Component

**What's wrong**: 280-line server component handles data fetching, business logic, and rendering for 3 different roles. Adding a new notification type requires modifying this file.

**What to improve**:
- Extract `fetchNotifications(userId, role, supabase)` into `src/lib/services/notifications.ts`.
- This service function returns `NotificationItem[]` — no rendering logic.
- The page becomes 30 lines: call service, pass to display component.

**Clean approach**:
```
notifications/
  page.tsx              ← ~30 lines: requireUser, call service, render
  NotificationsLiveClient.tsx  ← [unchanged]

lib/services/notifications.ts  ← fetchNotifications() — the 200 lines of logic
```

---

### `src/app/creator/dashboard/page.tsx` — Inline Components

**What's wrong**: `MetricCard`, `Panel`, and `OrderStatusBadge` are defined as local private functions inside a 350-line page file. `OrderStatusBadge` is duplicated in `components/marketplace/`.

**What to improve**:
- Move `MetricCard` and `Panel` to `src/components/creator/DashboardCard.tsx`.
- Use the existing `OrderStatusBadge` from `src/components/marketplace/`.
- The dashboard page drops to ~100 lines.

---

### `src/lib/admin/logAdminAction.ts` and `src/lib/audit/log.ts` — Duplicate Services

**What's wrong**: Two functions doing the same thing to two identical tables.

**What to improve**:
- One function: `logAudit(input: LogInput)`.
- One table: `audit_logs` (add a `source` column to differentiate admin vs. user events if needed).
- All action files call `logAudit()` instead of inlining Supabase queries.

---

### `src/components/marketplace/BuyButton.tsx` — UX Problems

**What's wrong**: Uses `alert()` for both success and error states. Error handling is correct (try/catch, getErrorMessage helper) but the delivery mechanism is a browser alert.

**What to improve**:
- Replace `alert()` with an inline error state variable displayed in the component.
- On success, show a brief inline confirmation before redirecting.
- The `sessionStorage` idempotency key pattern is actually correct and smart — keep it.

---

### `src/actions/profile/update.ts` — Missing Validation

**What's wrong**: Writes directly to DB without calling `validateUsername()`, `validateFullName()`, or `validateBio()`. The profile redirect on success is also fragile — if `username` is null, it navigates to `/u/null`.

**What to improve**:
```ts
// Correct approach:
export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const username = normalizeUsername(formData.get("username") as string ?? "");
  const fullName = (formData.get("full_name") as string ?? "").trim();
  const bio = (formData.get("bio") as string ?? "").trim();

  const usernameError = validateUsername(username);
  if (usernameError) throw new Error(usernameError);

  const fullNameError = validateFullName(fullName);
  if (fullNameError) throw new Error(fullNameError);

  // ... then write to DB
}
```

---

### `src/lib/payments/service.ts` — Excellent, Minor Polish Only

**What's correct**:
- Idempotency key validation and storage
- State machine with explicit transition guards
- Webhook event deduplication via unique constraint
- Optimistic concurrency (update where `status = currentStatus` — if it changed, re-fetch and decide)
- Graceful fallback if finalization partially fails (order created but status update fails)

**Minor improvements**:
- `PAYMENT_RESERVATION_MINUTES` (30) should live in a config file, not hardcoded.
- The `createCheckoutWithProvider` function returns `"mock"` checkout — the stub for Stripe/Razorpay is well-commented. Good.
- Consider extracting the webhook event persistence into its own function for testability.

---

## 9. Production-Grade Upgrades

### Logging System

Currently: `console.error("createCourse error:", error)` in 2-3 places.

**What to add**:
- Integrate **Sentry** or **LogRocket** for production error tracking.
- All server action errors should log to a structured sink: `{ action, userId, error, timestamp }`.
- Never log raw Supabase errors to the client — they may contain table names, column names, or query details.

```ts
// lib/logger.ts — minimal structured logger
export function logError(context: string, error: unknown, meta?: object) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ level: "error", context, message, ...meta, ts: new Date().toISOString() }));
  // In production: await sentry.captureException(error, { extra: { context, ...meta } });
}
```

### Error Boundaries

The app has no React error boundaries. If a client component throws, the whole page crashes silently.

**Add**:
```tsx
// components/ui/ErrorBoundary.tsx
"use client";
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <p>Something went wrong. Please refresh.</p>;
    return this.props.children;
  }
}
```
Wrap `NotificationsLiveClient`, `BuyButton`, and other interactive client components.

### Environment Separation

Currently: `.env.local` only, no validation.

**Add**:
- Use `@t3-oss/env-nextjs` or a simple hand-rolled `src/env.ts` that validates all required env vars at startup and throws with a clear error if any are missing.
- Have explicit `development`, `staging`, `production` environment configs.
- `PAYMENT_PROVIDER=mock` for development, real provider in production.

```ts
// lib/env.ts
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
export const env = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  paymentProvider: (process.env.PAYMENT_PROVIDER ?? "mock") as "mock" | "stripe" | "razorpay",
};
```

### Rate Limiting

**Add** per-endpoint rate limiting using an in-memory or Redis-backed solution (e.g., `@upstash/ratelimit`):
- Job application: 5 per hour per user
- Creator request: 1 per 24 hours per user
- Checkout initiation: 10 per hour per user

### Testing Strategy

**Current**: 3 test files covering pure utility functions (good start).

**Target**:
- Pure functions: Vitest (already done for payments, notifications, profile validation) ✅
- Server actions: Vitest with mocked Supabase client
- API routes: `supertest` or Next.js test helpers
- E2E: Playwright for the critical paths (signup → create profile → apply to job → buy item)

**Priority order for new tests**:
1. `updateApplicationStatus` — no auth, needs coverage
2. `createOrder` + payment flow — money involved, needs coverage
3. Creator request submission + approval flow
4. Admin role assignment

### Versioning

- Add `src/lib/constants.ts` → `APP_VERSION = "1.0.0"` and expose via a `/api/health` route.
- Use Supabase migration versioning (already doing this with timestamped migration files — correct).

### Before Going to Production

1. Fix the middleware (session refresh) — **critical**
2. Fix the storage policies for marketplace bucket — **security**
3. Add validation to `updateProfile` server action — **security**
4. Add auth to `updateApplicationStatus` — **security**
5. Remove `force-dynamic` from root layout for public pages — **performance**
6. Set up Sentry or equivalent error tracking — **reliability**
7. Configure `PAYMENT_PROVIDER=razorpay` (or `stripe`) with real API keys
8. Set `PAYMENT_WEBHOOK_SECRET` and verify webhook signatures properly

---

## 10. How Top Engineers Think

### Why Structure Matters

At Stripe, Linear, or Vercel, you're never the only person touching the codebase. The file structure is a **communication tool**. When a new engineer joins, they should be able to answer "where is the payment logic?" in under 30 seconds. With the current structure, they'd have to check `src/actions/`, `src/app/marketplace/[id]/buy/actions.ts`, `src/lib/payments/`, and `src/app/api/payments/webhook/` to get the full picture. With the proposed structure, `src/lib/payments/` contains everything.

> "Code is read far more than it is written." — Clean Code

### How to Approach Large Codebases

Top engineers do what I just did: **read before writing**. They map the data flow. They find the seams. They distinguish between "what the code does" and "what the code should do." They don't refactor because something looks ugly — they refactor because a specific future change will be unnecessarily hard.

The key questions are:
- **Where does the money flow?** (Payment service — well done here)
- **Where does auth fail?** (The missing middleware, the unguarded server action)
- **What breaks if one person misunderstands the system?** (The 3 impersonation copies — someone will update the wrong one)
- **What scales and what doesn't?** (16 admin dashboard queries, the God notifications page)

### Mental Models Used in Real Companies

**1. The Rule of Three**: If you copy code twice, refactor it. HustleClub has already hit this with impersonation (3 copies), audit logging (2 functions + inline inserts), and the Role type (5 declarations).

**2. Layered Architecture**: Keep layers honest. Pages orchestrate. Services contain logic. Repositories touch the DB. Never skip layers. When a page contains DB queries, you've lost the ability to test business logic independently.

**3. Make the Wrong Thing Hard**: Good systems make it difficult to accidentally do the wrong thing. Right now it's easy to write a server action with no auth guard. The solution is to make the pattern obvious: every action starts with `const { user } = await requireSession()` — and if you don't, code review catches it because the pattern is universal.

**4. Prioritize Security Over Elegance**: The missing middleware and the unguarded `updateApplicationStatus` aren't code smell — they're vulnerabilities. These get fixed before any DX improvement.

**5. Own Your Dependencies**: HustleClub is heavily dependent on Supabase (auth, DB, storage, realtime). This is fine — Supabase is excellent. But the DB queries should live in a repository layer so that if Supabase changes their SDK (or you need to swap), you change 10 files in `lib/db/`, not 50 files across `app/`.

### How to Avoid Messy Scaling

The entropy that kills codebases is gradual. Each shortcut makes sense locally: "I'll just add this one query here" or "I'll duplicate this function to save time." The problem is that after 50 such decisions, the codebase becomes impossible to reason about holistically.

The antidote is **conventions enforced by structure**:
- Server actions are only in `src/actions/`
- DB queries only go through `src/lib/db/`
- Auth guards always live in `src/lib/auth/session.ts`
- Types always come from `src/types/`

When the pattern is obvious and consistent, deviations stand out — in code review, in `grep`, and when reading the code 6 months later.

---

## Summary Scorecard

| Category | Current | Target |
|---|---|---|
| Architecture | ⭐⭐⭐ (solid core, duplications) | ⭐⭐⭐⭐⭐ |
| Security | ⭐⭐⭐ (good RLS, missing middleware) | ⭐⭐⭐⭐⭐ |
| Payment System | ⭐⭐⭐⭐⭐ (genuinely excellent) | ⭐⭐⭐⭐⭐ |
| Code Quality | ⭐⭐⭐ (good in parts, duplications) | ⭐⭐⭐⭐ |
| Testing | ⭐⭐ (good start, thin coverage) | ⭐⭐⭐⭐ |
| Performance | ⭐⭐ (force-dynamic everywhere) | ⭐⭐⭐⭐ |
| Maintainability | ⭐⭐⭐ (structural issues) | ⭐⭐⭐⭐⭐ |
| Production Readiness | ⭐⭐ (several blocking issues) | ⭐⭐⭐⭐ |

---

*HustleClub — Engineering Audit v1.0 | March 2026*
