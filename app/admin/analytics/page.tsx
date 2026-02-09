import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const [
    users,
    creators,
    jobs,
    courses,
    items,
    creatorRequests,
    orders,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "creator"),
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase
      .from("marketplace_items")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("creator_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("marketplace_orders")
      .select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Total Users", value: users.count ?? 0 },
    { label: "Creators", value: creators.count ?? 0 },
    { label: "Jobs Posted", value: jobs.count ?? 0 },
    { label: "Courses", value: courses.count ?? 0 },
    { label: "Marketplace Items", value: items.count ?? 0 },
    { label: "Pending Creator Requests", value: creatorRequests.count ?? 0 },
    { label: "Orders", value: orders.count ?? 0 },
  ];

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin Analytics</h1>
        <p className="text-sm text-gray-600">
          Platform overview & activity
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="border rounded-xl bg-white p-5"
          >
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </section>
    </main>
  );
}