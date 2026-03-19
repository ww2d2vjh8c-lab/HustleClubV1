import Link from "next/link";

export const dynamic = "force-dynamic"; 
// 🔥 IMPORTANT: NEVER force-static when using auth in layout

export default function HomePage() {
  return (
    <main className="space-y-16 pb-16">
      <section className="app-container pt-10 md:pt-16">
        <div className="app-surface rounded-3xl p-7 md:p-10 overflow-hidden relative">
          <div className="absolute -right-8 -top-10 h-44 w-44 rounded-full bg-sky-200/45 blur-2xl" />
          <div className="absolute -left-8 -bottom-14 h-44 w-44 rounded-full bg-emerald-200/45 blur-2xl" />

          <div className="relative z-10 grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
            <div>
              <p className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                Creator commerce and career platform
              </p>
              <h1 className="mt-5 text-4xl md:text-6xl font-semibold font-[var(--font-display)] tracking-tight leading-[1.04]">
                Learn. Earn. Build your creator income.
              </h1>
              <p className="mt-4 text-base md:text-lg text-slate-600 max-w-2xl">
                HustleClub combines skill learning, paid opportunities, and a trusted marketplace in one simple workflow.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/jobs" className="rounded-full bg-slate-900 px-5 py-2.5 text-white font-medium hover:bg-slate-800">
                  Find paid jobs
                </Link>
                <Link href="/courses" className="rounded-full border border-slate-300 bg-white px-5 py-2.5 font-medium hover:bg-slate-50">
                  Explore courses
                </Link>
                <Link href="/marketplace" className="rounded-full border border-slate-300 bg-white px-5 py-2.5 font-medium hover:bg-slate-50">
                  Shop marketplace
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              <InsightCard value="12+" label="End-to-end creator workflows" />
              <InsightCard value="3" label="Revenue channels in one platform" />
              <InsightCard value="Live" label="Role-based dashboards and analytics" />
            </div>
          </div>
        </div>
      </section>

      <section className="app-container grid gap-5 md:grid-cols-3">
        <FeatureCard
          title="Courses"
          description="Publish and learn practical creator skills with progress-aware dashboards."
          href="/courses"
          cta="Start learning"
        />
        <FeatureCard
          title="Jobs"
          description="Apply to creator gigs, track decisions, and manage hiring pipelines quickly."
          href="/jobs"
          cta="See opportunities"
        />
        <FeatureCard
          title="Marketplace"
          description="List products, place orders, and manage shipping with clear order states."
          href="/marketplace"
          cta="Browse items"
        />
      </section>

      <section className="app-container">
        <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold font-[var(--font-display)]">Built for users, creators, and admins</h2>
          <p className="mt-2 text-slate-600">
            Users discover and buy. Creators publish and fulfill. Admins moderate and optimize with analytics.
          </p>
          <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm">
            <RoleChip title="User" detail="Enroll, apply, buy, track" />
            <RoleChip title="Creator" detail="Publish, sell, analyze" />
            <RoleChip title="Admin" detail="Moderate, approve, scale" />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="app-card rounded-2xl p-6 transition block hover:-translate-y-0.5"
    >
      <h3 className="font-semibold text-xl font-[var(--font-display)]">{title}</h3>
      <p className="mt-2 text-slate-600 text-sm leading-relaxed">{description}</p>
      <p className="mt-5 inline-flex rounded-full border border-slate-300 px-3 py-1 text-sm font-medium">
        {cta}
      </p>
    </Link>
  );
}

function InsightCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-2xl font-semibold font-[var(--font-display)]">{value}</p>
      <p className="text-sm text-slate-600 mt-1">{label}</p>
    </div>
  );
}

function RoleChip({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="font-semibold">{title}</p>
      <p className="text-slate-600 mt-0.5">{detail}</p>
    </div>
  );
}
