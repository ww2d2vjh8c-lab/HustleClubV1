# HustleClub

**A full-stack creator economy platform built for India.**
Creators sell courses, post gig jobs, and list marketplace items. Users learn, apply, and buy — all in one place.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-hustleclub.vercel.app-5B2DE8?style=for-the-badge)](https://hustleclub.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

---

## What it does

HustleClub is a **multi-sided marketplace** with three revenue channels in one app:

| Channel | Creator does | User does |
|---|---|---|
| **Courses** | Create + publish lessons | Enrol + learn |
| **Gig Jobs** | Post UGC/freelance jobs | Apply + get hired |
| **Marketplace** | List digital / thrift items | Browse + buy |

Role system: `user` → `creator` (admin-approved) → `admin`

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 App Router (SSR + Server Actions) |
| Language | TypeScript — 0 errors across full codebase |
| UI | React 19 + Tailwind CSS 4 |
| Database | Supabase PostgreSQL with Row Level Security |
| Auth | Supabase Auth + `@supabase/ssr` (cookie-based SSR sessions) |
| Storage | Supabase Storage (avatars + marketplace images) |
| Realtime | Supabase Realtime channels (live notifications) |
| Payments | Pluggable FSM — mock / Stripe / Razorpay via env var |
| Testing | Vitest |
| CI/CD | GitHub Actions → Vercel (staging + production pipelines) |

---

## Architecture

```
HTTP Request
  → middleware.ts          (Supabase session refresh on every request)
  → RootLayout             (SSR: reads user + role → renders Navbar server-side)
  → Page / Layout          (requireUser / requireCreator / requireAdmin guards)
  → Server Action          (auth-gated, calls service layer)
  → lib/payments/          (idempotent FSM, webhook deduplication)
  → Supabase / PostgreSQL  (RLS as defense-in-depth)
```

**Key architectural decisions:**

- **Middleware session refresh** — Supabase SSR cookies refreshed on every request via `createServerClient` in `middleware.ts`. No silent session expiry.
- **Defense-in-depth auth** — RLS at the DB layer + `requireUser/Creator/Admin` guards at the application layer. Both must pass.
- **Idempotent payment FSM** — `sessionStorage` idempotency key prevents duplicate charges on retries. State machine (`created → processing → succeeded/failed`) makes all transitions explicit and testable.
- **Webhook deduplication** — `payment_webhook_events.event_id` unique constraint blocks double-processing at the database level.
- **Admin impersonation** — httpOnly cookie overlay; swaps `user.id` in all downstream queries. Full audit trail on every action.

---

## Key Features

### Payment System
- Full state machine: `created → requires_action → processing → succeeded / failed / cancelled / refunded`
- Idempotency key pattern (sessionStorage) — safe on retry, safe on double-click
- Webhook signature validation, event deduplication via unique DB constraint
- Optimistic concurrency: `UPDATE WHERE status = currentStatus` — prevents race conditions
- Atomic item lock on purchase (`is_sold = true`)
- Provider-agnostic: swap `PAYMENT_PROVIDER=razorpay` in env, zero code changes

### Admin Console
- Platform analytics dashboard (users, creators, GMV, job counts)
- Creator request queue with approve / reject
- User role management with self-protection guard
- **User impersonation** — admin views the platform as any user for debugging
- Full audit log (actor, action, target, metadata, timestamp) via `logAudit()`

### Security Hardening (post-audit)
- Server-side input validation on all mutations (`validateUsername`, `validateBio`, etc.)
- Marketplace storage RLS scoped to owner folder (`split_part(name, '/', 1) = auth.uid()::text`)
- `updateApplicationStatus` requires creator ownership check — not just RLS
- Webhook secret required in production; fails-closed if missing

### Notifications
- Role-aware feed (user / creator / admin see different events)
- Supabase Realtime channel with proper `useEffect` cleanup on unmount
- 60-second polling fallback

---

## CI/CD Pipeline

```
Push any branch     → CI: lint + tsc --noEmit + vitest
Open PR → main      → PR Checks: CI + Vercel preview URL + migration diff comment
Merge to main       → Deploy → Staging: migrations + Vercel + /api/health smoke test
Push tag v*.*.*     → Deploy → Production: manual approval gate + migrations + Vercel --prod + GitHub Release
```

Daily at 00:30 IST — Supabase Edge Function aggregates platform analytics into `analytics_daily_snapshots`.

---

## Documentation

| Doc | Contents |
|---|---|
| [`docs/AUDIT.md`](./docs/AUDIT.md) | 22-issue engineering audit — architecture, security, performance |
| [`docs/EXECUTION-PLAN.md`](./docs/EXECUTION-PLAN.md) | Master fix plan — 20 microtasks, phases A–F, Claude Code execution commands |
| [`docs/PIPELINE.md`](./docs/PIPELINE.md) | CI/CD setup guide, secrets reference, data pipeline docs |
| [`docs/HustleClub-PRD.docx`](./docs/HustleClub-PRD.docx) | Product Requirements Document |
| [`docs/HustleClub-TRD.docx`](./docs/HustleClub-TRD.docx) | Technical Requirements Document |

---

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/HustleClubV1
cd HustleClubV1
npm install

# 2. Set environment variables
cp .env.example .env.local
# Fill in your Supabase credentials (see below)

# 3. Run migrations
# Paste supabase/migrations/*.sql into Supabase SQL editor in order

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PAYMENT_PROVIDER=mock
PAYMENT_WEBHOOK_SECRET=any_string_for_local_dev
```

---

## Built by

**Ayush Kaushik** · [coc123.1607@gmail.com](mailto:coc123.1607@gmail.com)
