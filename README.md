This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
🚀 HustleClub

Learn. Earn. Trade.

HustleClub is a creator-first platform designed for India that combines:
	•	🎓 Creator-made courses
	•	💼 UGC clipping jobs (earn via short-form content)
	•	🛍️ Thrift marketplace
	•	👥 Community-driven ecosystem

All in one clean, minimal, and scalable platform.

⸻

🌍 Vision

HustleClub aims to become India’s creator-powered digital marketplace where:
	•	Creators sell knowledge & digital products
	•	Users earn money through UGC content
	•	Communities grow around skills & hustles
	•	Everything feels premium but accessible

⸻

🧱 Tech Stack

Frontend
	•	Next.js 16 (App Router)
	•	React 19
	•	Tailwind CSS 4
	•	TypeScript

Backend
	•	Supabase
	•	Auth
	•	Postgres Database
	•	Row Level Security (RLS)
	•	Server-side session handling

Architecture
	•	Hybrid SSR + Client Components
	•	Server-based auth session resolution
	•	RLS-protected role-based access
	•	Middleware/Proxy-based cookie refresh

⸻

🔐 Authentication System
	•	Email/password login
	•	Supabase SSR session sync
	•	Server-evaluated auth in layout.tsx
	•	Role-based rendering:
	•	user
	•	creator
	•	admin


Session flow:   
Login → Supabase Auth → Cookie Set →
Server Layout Reads Session →
Navbar Updates →
Protected Routes Enabled

🗂 Project Structure
/app
  layout.tsx
  page.tsx
  /profile
  /creator
  /jobs
  /marketplace
  /(auth)
    /login
    /signup

/components
  /navigation
    Navbar.tsx
  /profile
  /creator
  /dashboard

/lib
  /supabase
    client.ts
    server.ts
    requireCreator.ts

proxy.ts

🎯 Core Features (Current)

✅ Implemented
	•	Auth system (login/signup)
	•	SSR session sync
	•	Role-based navbar
	•	Profile bootstrap system
	•	Creator role system
	•	Creator dashboard route protection
	•	RLS-secured profiles table

🚧 In Progress
	•	Marketplace CRUD
	•	Job posting flow
	•	UGC tracking system
	•	Creator analytics
	•	Admin dashboard

⸻

👤 User Roles

User
	•	Browse jobs
	•	Browse marketplace
	•	Apply to become creator

Creator
	•	Post jobs
	•	Manage dashboard
	•	Track applications

Admin
	•	Review creator requests
	•	Moderate platform

⸻

🛠 Environment Setup

Create .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

⚙️ Development Setup

1️⃣ Install dependencies
npm install

2️⃣ Run dev server
npm run dev

App runs on:
http://localhost:3000

🔐 Supabase Requirements

Auth Settings
	•	Site URL: http://localhost:3000
	•	Email confirmation: OFF (for dev)

Required RLS Policies (profiles table)
	•	Insert own profile
	•	Read own profile
	•	Update own profile

⸻

🧠 Architectural Decisions

Why Server-Driven Navbar?

To avoid hydration mismatch and client-side session inconsistency.

Navbar receives:
user + role

directly from server layout.

Why force-dynamic?

To prevent static rendering from caching unauthenticated states.

⸻

📈 Future Roadmap

Phase 1
	•	Stable creator ecosystem
	•	Job application tracking
	•	Marketplace MVP

Phase 2
	•	UGC clip verification system
	•	View-based payout logic
	•	Community forums

Phase 3
	•	Subscription system
	•	Featured creators
	•	Mobile-first UI refinement
	•	Payment gateway integration (UPI focus)

⸻

🎨 Design Philosophy
	•	Minimal but bold
	•	Creator-first
	•	No dark patterns
	•	Trust-driven UI
	•	Clean, scalable system

⸻

🚀 Long-Term Goal

To become:

The Indian creator commerce engine
— where skills become income.

⸻

🧑‍💻 Contributing
	1.	Fork repository
	2.	Create branch
	3.	Submit PR
	4.	Keep code typed & structured

⸻

📜 License

Private Project — HustleClub © 2026
