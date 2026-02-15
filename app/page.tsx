import Link from "next/link";

export const dynamic = "force-dynamic"; 
// 🔥 IMPORTANT: NEVER force-static when using auth in layout

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      
      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Learn. Earn. Trade.
        </h1>

        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          HustleClub is a creator-first platform to learn from creators,
          earn through UGC jobs, and trade thrifted items — all in one place.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/jobs"
            className="px-6 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition"
          >
            Explore Jobs
          </Link>

          <Link
            href="/marketplace"
            className="px-6 py-3 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 transition"
          >
            Browse Marketplace
          </Link>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid gap-6 md:grid-cols-3">
        <FeatureCard
          title="🎓 Learn from Creators"
          description="Browse creator-made courses and learn real skills. No fluff. Just practical knowledge."
          href="/courses"
        />

        <FeatureCard
          title="💼 Earn with UGC Jobs"
          description="Apply to short-form content and clipping jobs posted by creators and brands."
          href="/jobs"
        />

        <FeatureCard
          title="🛍️ Thrift Marketplace"
          description="Buy and sell thrifted items from the community. Clean, simple, and scam-free."
          href="/marketplace"
        />
      </section>

      {/* TRUST STRIP */}
      <section className="border-t bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-10 text-center text-sm text-gray-600">
          Built for hustlers and creators in India · No spam · No dark patterns
        </div>
      </section>

    </main>
  );
}

function FeatureCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="border rounded-xl p-6 hover:shadow-md transition bg-white block"
    >
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-gray-600 text-sm leading-relaxed">
        {description}
      </p>
      <p className="mt-4 text-sm font-medium text-black">
        Explore →
      </p>
    </Link>
  );
}