<p align="center">
  <img src="https://img.shields.io/badge/Live-hustleclubv1.vercel.app-brightgreen?style=for-the-badge&logo=vercel" alt="Live Demo" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" />
  <img src="https://img.shields.io/badge/Razorpay-FSM-02042B?style=for-the-badge&logo=razorpay" />
  <img src="https://img.shields.io/badge/CI/CD-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions" />
</p>

<h1 align="center">HustleClub</h1>
<p align="center"><strong>Full-stack creator economy marketplace — courses, gigs, and digital goods</strong></p>

<p align="center">
  <a href="https://hustleclubv1.vercel.app"><strong>🚀 Live Demo → hustleclubv1.vercel.app</strong></a>
</p>

---

## What is HustleClub?

HustleClub is a multi-sided creator marketplace where creators sell courses, freelance gigs, and digital goods — and buyers discover and purchase them. Built production-quality with real auth, real payments, and real CI/CD.

**Three revenue streams in one platform:**

| Stream | What it does |
|--------|-------------|
| 📚 Courses | Creators publish video/text courses; buyers enroll and learn |
| 💼 Gig Jobs | Creators offer freelance services; clients browse and hire |
| 🛒 Digital Goods | Creators sell files, templates, presets — instant download after payment |

---

## Try the Live Demo

**URL:** https://hustleclubv1.vercel.app

Sign up with any email, or use the test flow:
1. Register as a **buyer** → browse courses and gigs
2. Apply to become a **creator** (admin approves) → publish listings
3. Test payment with Razorpay test card: `4111 1111 1111 1111` · Exp: any future date · CVV: any 3 digits

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                 │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Server Actions │  │  Middleware  │  │  API Routes  │  │
│  │  (mutations)    │  │  (auth SSR)  │  │  (webhooks)  │  │
│  └────────────────┘  └──────────────┘  └─────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
            ┌────────────▼────────────┐
            │      Supabase           │
            │  ┌──────┐  ┌────────┐  │
            │  │  DB   │  │  Auth  │  │
            │  │  RLS  │  │  SSR   │  │
            │  └──────┘  └────────┘  │
            │  ┌──────┐  ┌────────┐  │
            │  │  RT   │  │Storage │  │
            │  └──────┘  └────────┘  │
            └────────────────────────┘
                         │
            ┌────────────▼────────────┐
            │      Razorpay FSM       │
            │  created → authorized   │
            │  → captured → refunded  │
            └────────────────────────┘
```

---

## Key Technical Decisions

### Payment FSM with Idempotency
Razorpay orders follow a strict state machine: `created → authorized → captured → refunded`. Every state transition is idempotent — if a webhook fires twice, the second call is a no-op. Prevents double-charges on network retries.

```typescript
// Webhook deduplication — idempotency key checked before processing
const existing = await db.payment.findUnique({ where: { razorpayOrderId } });
if (existing?.status === targetStatus) return; // already processed
```

### Auth Architecture
Supabase SSR sessions are refreshed on every request via Next.js middleware — no stale tokens. Row Level Security provides a second layer: even if application code has a bug, the database rejects unauthorized reads/writes.

```typescript
// middleware.ts — runs on every request
const { data: { session } } = await supabase.auth.getSession();
if (!session && isProtectedRoute(req)) redirect('/login');
```

### Role-Based Access Control
Three-tier role system enforced server-side:
```
user → (admin approves) → creator → (platform) → admin
```
Every protected route checks role via Server Action or API route — never trust the client.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, SSR, Server Actions) |
| Language | TypeScript — zero `any`, strict mode |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (SSR) + RLS |
| Realtime | Supabase Realtime (notifications) |
| Storage | Supabase Storage (digital goods, thumbnails) |
| Payments | Razorpay (FSM, webhooks, idempotency) |
| Hosting | Vercel (frontend) |
| CI/CD | GitHub Actions → Vercel (staging + production) |
| Testing | Vitest |

---

## Project Structure

```
hustleclub/
├── app/
│   ├── (auth)/           # Login, register, callback
│   ├── (dashboard)/      # Creator dashboard
│   ├── courses/          # Course listing + detail pages
│   ├── gigs/             # Gig listing + detail pages
│   ├── marketplace/      # Digital goods store
│   └── api/
│       └── webhooks/
│           └── razorpay/ # Payment webhook handler
├── components/
│   ├── ui/               # Shared UI components
│   ├── courses/          # Course-specific components
│   └── payments/         # Checkout, payment status
├── lib/
│   ├── supabase/         # Client, server, middleware helpers
│   ├── razorpay/         # FSM, webhook verification
│   └── rbac/             # Role guards
├── hooks/                # Custom React hooks
├── types/                # TypeScript types + Supabase generated
└── supabase/
    └── migrations/       # Database schema migrations
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Razorpay](https://razorpay.com) account (test mode is free)

### 1. Clone and install

```bash
git clone https://github.com/ww2d2vjh8c-lab/HustleClubV1.git
cd HustleClubV1
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database setup

```bash
# Apply migrations via Supabase CLI
npx supabase db push
```

Or run the SQL in `supabase/migrations/` manually in the Supabase dashboard.

### 4. Run

```bash
npm run dev
# Open http://localhost:3000
```

---

## CI/CD Pipeline

```
Push to main branch
      │
      ▼
GitHub Actions
  ├── Type check (tsc --noEmit)
  ├── Lint (eslint)
  └── Test (vitest)
      │
      ▼ (if all pass)
Vercel Deploy
  ├── Preview URL (every PR)
  └── Production (main branch)
```

---

## Testing

```bash
npm run test          # Run Vitest suite
npm run test:watch    # Watch mode
npm run type-check    # TypeScript validation
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes with tests
4. Open a PR — CI runs automatically

---

## License

MIT — see [LICENSE](LICENSE)

---

<p align="center">Built by <a href="https://github.com/ww2d2vjh8c-lab">Ayush Kaushik</a></p>
