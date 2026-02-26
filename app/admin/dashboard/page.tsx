import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  created_at: string;
};

export default async function AdminDashboardPage() {
  const { user, supabase } = await requireAdmin();

  const [
    adminProfileRes,
    usersRes,
    creatorsRes,
    pendingCreatorRes,
    jobsRes,
    openJobsRes,
    pendingApplicationsRes,
    coursesRes,
    draftCoursesRes,
    listingsRes,
    liveListingsRes,
    paidOrdersRes,
    shippedOrdersRes,
    auditsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, username, full_name, created_at")
      .eq("id", user.id)
      .single()
      .returns<ProfileRow>(),
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
    supabase
      .from("job_applications")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending"),
    supabase.from("courses").select("id", { head: true, count: "exact" }),
    supabase
      .from("courses")
      .select("id", { head: true, count: "exact" })
      .neq("status", "published"),
    supabase
      .from("marketplace_items")
      .select("id", { head: true, count: "exact" }),
    supabase
      .from("marketplace_items")
      .select("id", { head: true, count: "exact" })
      .eq("is_published", true)
      .eq("is_sold", false),
    supabase
      .from("marketplace_orders")
      .select("id", { head: true, count: "exact" })
      .eq("status", "paid"),
    supabase
      .from("marketplace_orders")
      .select("id", { head: true, count: "exact" })
      .eq("status", "shipped"),
    supabase
      .from("audit_logs")
      .select("id", { head: true, count: "exact" }),
  ]);

  const profile = adminProfileRes.data;
  const adminName =
    profile?.full_name?.trim() ||
    profile?.username?.trim() ||
    profile?.email?.trim() ||
    user.email ||
    "Admin";

  const cards = [
    { label: "Total Users", value: usersRes.count ?? 0 },
    { label: "Creators", value: creatorsRes.count ?? 0 },
    { label: "Pending Creator Requests", value: pendingCreatorRes.count ?? 0 },
    { label: "Jobs", value: jobsRes.count ?? 0 },
    { label: "Open Jobs", value: openJobsRes.count ?? 0 },
    { label: "Pending Applications", value: pendingApplicationsRes.count ?? 0 },
    { label: "Courses", value: coursesRes.count ?? 0 },
    { label: "Draft/Unpublished Courses", value: draftCoursesRes.count ?? 0 },
    { label: "Marketplace Items", value: listingsRes.count ?? 0 },
    { label: "Live Listings", value: liveListingsRes.count ?? 0 },
    { label: "Paid Orders To Ship", value: paidOrdersRes.count ?? 0 },
    { label: "Shipped Orders", value: shippedOrdersRes.count ?? 0 },
    { label: "Audit Logs", value: auditsRes.count ?? 0 },
  ];

  const quickLinks = [
    { href: "/admin/users", label: "Manage Users & Roles" },
    { href: "/admin/creator-requests", label: "Review Creator Requests" },
    { href: "/admin/jobs", label: "Moderate Jobs" },
    { href: "/admin/jobs/applicants", label: "Review Job Applications" },
    { href: "/admin/courses", label: "Moderate Courses" },
    { href: "/admin/marketplace", label: "Moderate Listings" },
    { href: "/admin/marketplace/orders", label: "Manage Marketplace Orders" },
    { href: "/admin/analytics", label: "Platform Analytics" },
    { href: "/admin/creator-analytics", label: "Creator Performance Analytics" },
    { href: "/admin/audit-logs", label: "Open Audit Logs" },
  ];

  return (
    <main className="space-y-8">
      <header className="app-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Verified admin account</p>
            <h1 className="text-3xl font-semibold font-[var(--font-display)]">Welcome, {adminName}</h1>
            <p className="text-sm text-slate-600">
              You have full moderation powers across users, creators, jobs, courses, marketplace, and audit systems.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 font-medium">
            Access level: Administrator
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <InfoTile label="Admin Email" value={profile?.email ?? user.email ?? "—"} />
          <InfoTile label="Admin ID" value={user.id.slice(0, 8)} />
          <InfoTile
            label="Profile Created"
            value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
          />
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="app-card rounded-xl p-4">
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="app-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold font-[var(--font-display)]">Admin Controls</h2>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm px-3 py-2 rounded-full border border-slate-200 hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900 break-all">{value}</p>
    </div>
  );
}
