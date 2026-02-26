import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const [
    usersRes,
    creatorsRes,
    pendingCreatorRes,
    jobsRes,
    openJobsRes,
    applicationsRes,
    coursesRes,
    listingsRes,
    ordersRes,
    pendingShipmentsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { head: true, count: "exact" }),
    supabase
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .eq("role", "creator"),
    supabase
      .from("creator_requests")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending"),
    supabase.from("jobs").select("id", { head: true, count: "exact" }),
    supabase
      .from("jobs")
      .select("id", { head: true, count: "exact" })
      .eq("is_open", true),
    supabase.from("job_applications").select("id", { head: true, count: "exact" }),
    supabase.from("courses").select("id", { head: true, count: "exact" }),
    supabase
      .from("marketplace_items")
      .select("id", { head: true, count: "exact" }),
    supabase
      .from("marketplace_orders")
      .select("id", { head: true, count: "exact" }),
    supabase
      .from("marketplace_orders")
      .select("id", { head: true, count: "exact" })
      .eq("status", "paid"),
  ]);

  const cards = [
    { label: "Total Users", value: usersRes.count ?? 0 },
    { label: "Creators", value: creatorsRes.count ?? 0 },
    { label: "Pending Creator Requests", value: pendingCreatorRes.count ?? 0 },
    { label: "Total Jobs", value: jobsRes.count ?? 0 },
    { label: "Open Jobs", value: openJobsRes.count ?? 0 },
    { label: "Applications", value: applicationsRes.count ?? 0 },
    { label: "Courses", value: coursesRes.count ?? 0 },
    { label: "Listings", value: listingsRes.count ?? 0 },
    { label: "Orders", value: ordersRes.count ?? 0 },
    { label: "Orders To Ship", value: pendingShipmentsRes.count ?? 0 },
  ];

  const quickLinks = [
    { href: "/admin/creator-requests", label: "Review Creator Requests" },
    { href: "/admin/jobs", label: "Manage Jobs" },
    { href: "/admin/marketplace/orders", label: "Monitor Marketplace Orders" },
    { href: "/admin/audit-logs", label: "View Audit Logs" },
    { href: "/admin/users", label: "Manage User Roles" },
  ];

  return (
    <main className="p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">
          Live platform overview and moderation shortcuts.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm px-3 py-2 rounded border hover:bg-gray-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
