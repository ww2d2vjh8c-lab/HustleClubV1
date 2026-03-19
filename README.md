# 🚀 HustleClub

> **Learn. Earn. Trade.**

HustleClub is a creator-first commerce and career platform built for India. It combines three revenue channels — courses, paid UGC gig jobs, and a thrift/digital marketplace — with a role-based ecosystem for users, creators, and admins.

---

## 🌍 Vision

HustleClub aims to become India's creator-powered digital marketplace where:

- Creators sell knowledge and digital products
- Users earn money through UGC content gigs
- Communities grow around skills and hustles
- Everything feels premium but accessible

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Language | TypeScript |
| Backend | Supabase (Auth + Postgres + Storage + Realtime) |
| Database Security | Row Level Security (RLS) |
| Payments | Pluggable provider layer (mock / Stripe / Razorpay) |
| Testing | Vitest |

---

## ✅ Implemented Features

### Authentication
- Email/password signup and login
- Server-side SSR session resolution via `@supabase/ssr`
- Role-based navbar (rendered server-side, no hydration flash)
- Email verification resend flow

### User Roles
| Role | Capabilities |
|---|---|
| **User** | Browse courses, jobs, and marketplace · Apply to jobs · Buy items · Apply to become creator |
| **Creator** | Post and manage jobs · Create and publish courses · List marketplace items · View analytics · Manage applications and orders |
| **Admin** | Review and approve creator requests · Moderate jobs, courses, and listings · Impersonate users · View platform analytics · Full audit log access |

### Jobs System
- Creator job posting with title, description, budget, type
- Open/closed job status
- User job applications with status tracking (pending → accepted/rejected)
- Creator applicant management dashboard
- Job views tracking (per-user and per-IP)

### Courses System
- Creator course creation (title, description, image, pricing)
- Draft/published workflow
- User enrollment system
- Course learning page (enrolled-only access)
- Creator course analytics

### Marketplace
- Item listing with images (Supabase Storage), description, price
- Draft/published/sold item states
- Full buy flow with idempotent payment state machine
- Order tracking (paid → shipped → delivered)
- Seller order management dashboard

### Payment System
- Idempotent checkout with session-storage key persistence
- State machine: `created → requires_action → processing → succeeded/failed/cancelled/refunded`
- Webhook event persistence and deduplication
- Pluggable provider: swap mock → Stripe or Razorpay via `PAYMENT_PROVIDER` env var
- Concurrency-safe item locking (`is_sold = true` atomic update)
- Automatic expired reservation cleanup

### Admin Console
- Platform-wide analytics dashboard (users, creators, jobs, courses, marketplace, payments)
- Creator request review and bulk approve/reject
- User role management with self-protection guard
- Admin impersonation (view platform as any user)
- Audit log for all moderated actions
- Admin sidebar navigation

### Notifications
- Role-aware notification feed (different content for user / creator / admin)
- Supabase Realtime channel subscriptions for live updates
- 60-second polling fallback
- Notification deduplication

### Profile System
- Username, full name, bio, avatar (Supabase Storage)
- Profile completeness enforcement before accessing gated features
- Public profile page at `/u/:username`
- Client-side validation + server-side validation helpers

---

## 🗂 Project Structure

```
/src
├── actions/            Server actions (createJob, createCourse, createOrder, etc.)
├── app/
│   ├── (auth)/         Login, signup, signout routes
│   ├── admin/          Admin console (dashboard, users, jobs, courses, marketplace, analytics)
│   ├── api/            API routes (auth, payments webhook, creator requests)
│   ├── creator/        Creator dashboard, jobs, courses, marketplace management
│   ├── courses/        Public course browse + detail
│   ├── jobs/           Public job browse + detail
│   ├── marketplace/    Public marketplace browse + buy flow + orders
│   ├── notifications/  Role-aware notification feed with live updates
│   └── profile/        Profile edit page
├── components/
│   ├── admin/          Admin-specific components (sidebar, impersonation banner, etc.)
│   ├── jobs/           Job cards, applicant management
│   ├── marketplace/    Item cards, buy button, order management
│   ├── navigation/     Navbar (server-rendered, role-aware)
│   ├── profile/        Profile form, avatar uploader, profile hover card
│   └── ui/             Generic design system (Card, Button, Badge, Skeleton, etc.)
└── lib/
    ├── auth/           requireUser, requireCreator, requireAdmin guards
    ├── audit/          logAuditEvent() helper
    ├── notifications/  Notification helpers + formatRelativeTime
    ├── payments/       Payment service (state machine + checkout) + state FSM
    ├── profile/        isProfileComplete, validation functions
    └── supabase/       Server client, browser client, admin client, auth resolvers

/supabase
└── migrations/         Full schema: tables, RLS policies, indexes, triggers, storage buckets
```

---

## 🔐 Authentication Flow

```
Login → Supabase Auth → SSR Cookie Set
      → RootLayout reads session server-side
      → Profile role fetched
      → Navbar(user, role) rendered
      → Protected routes check via requireUser/requireCreator/requireAdmin
      → RLS enforces at database level as defense-in-depth
```

---

## 🛠 Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Payment provider: "mock" | "stripe" | "razorpay"
PAYMENT_PROVIDER=mock

# Optional: set a secret to validate incoming payment webhooks
PAYMENT_WEBHOOK_SECRET=your_webhook_secret
```

---

## ⚙️ Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
# → http://localhost:3000

# 3. Run tests
npm test

# 4. Type-check
npx tsc --noEmit
```

### Supabase Setup

1. Create a Supabase project
2. Run all migrations from `supabase/migrations/` in order via the Supabase SQL Editor
3. In Supabase Auth settings: set Site URL to `http://localhost:3000`
4. Email confirmation can be disabled for local development

---

## 📈 Roadmap

### Phase 1 — Completed ✅
- Auth system, role-based access
- Job posting, applications, and tracking
- Course creation, publishing, and enrollment
- Marketplace with full buy/sell/order flow
- Payment state machine with webhook support
- Admin dashboard with analytics, moderation, and audit logs
- Creator dashboard and analytics
- Realtime notifications

### Phase 2 — In Progress 🚧
- UGC clip verification system
- View-based payout logic for creators
- Community forums
- Mobile-first UI refinement
- Rate limiting on key endpoints

### Phase 3 — Planned
- Subscription tiers
- Featured creator placements
- Live Stripe / Razorpay payment integration (UPI focus)
- Push notifications
- Creator leaderboards

---

## 🧠 Architectural Decisions

**Why server-rendered Navbar?**
To avoid hydration mismatches. The user session and role are resolved once on the server and passed as props — no client-side session reads, no flash of wrong UI.

**Why RLS + application-level auth guards?**
Defense in depth. RLS prevents unauthorized DB access even if application code has a bug. Application guards (requireUser, requireCreator, requireAdmin) give clear, auditable control flow and enable proper redirect behavior.

**Why an idempotent payment state machine?**
Payments are the highest-risk part of any platform. The idempotency key pattern ensures that duplicate requests (from retries or double-clicks) never create duplicate charges or orders. The FSM makes all valid and invalid state transitions explicit and testable.

---

## 🎨 Design Philosophy

- Minimal but bold — clean surfaces, purposeful typography
- Creator-first — creator workflows are first-class, not bolted on
- No dark patterns — trust-driven UI at every touchpoint
- Scalable system — architecture designed for growth, not just MVP

---

## 📄 Docs

- [`docs/full-website-wireframe.md`](./docs/full-website-wireframe.md) — Full sitemap, role flows, API wireframe
- [`docs/payment-integration.md`](./docs/payment-integration.md) — Payment provider integration guide
- [`docs/AUDIT.md`](./docs/AUDIT.md) — Engineering audit: architecture review, known issues, refactor plan

---

## 🧑‍💻 Contributing

1. Fork the repository
2. Create a feature branch
3. Keep all code typed — `npx tsc --noEmit` must pass
4. Submit a PR with a clear description

---

## 📜 License

Private Project — HustleClub © 2026
