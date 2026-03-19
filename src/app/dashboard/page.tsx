import { Role } from "@/types";
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { getCreatorRequestStatus } from "@/lib/creator/getCreatorRequestStatus";

export const dynamic = "force-dynamic";

type JobApplicationRow = {
  id: string;
  status: string;
  created_at: string;
};
type MarketplaceOrderRow = {
  id: string;
  status: string;
  price: number | string;
  created_at: string;
};

export default async function UserDashboardPage() {
  const { user, supabase } = await requireUser();
  const now = new Date().getTime();
  const thirtyDaysAgoISO = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    profileRes,
    courseCountRes,
    courseCount30Res,
    jobAppsRes,
    pendingAppsRes,
    acceptedAppsRes,
    ordersRes,
    ordersToConfirmRes,
    jobApplicationsActivityRes,
    ordersActivityRes,
    creatorRequestStatus,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, full_name, username")
      .eq("id", user.id)
      .single(),
    supabase
      .from("course_enrollments")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id),
    supabase
      .from("course_enrollments")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgoISO),
    supabase
      .from("job_applications")
      .select("id", { head: true, count: "exact" })
      .eq("applicant_id", user.id),
    supabase
      .from("job_applications")
      .select("id", { head: true, count: "exact" })
      .eq("applicant_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("job_applications")
      .select("id", { head: true, count: "exact" })
      .eq("applicant_id", user.id)
      .eq("status", "accepted"),
    supabase
      .from("marketplace_orders")
      .select("id", { head: true, count: "exact" })
      .eq("buyer_id", user.id),
    supabase
      .from("marketplace_orders")
      .select("id", { head: true, count: "exact" })
      .eq("buyer_id", user.id)
      .eq("status", "shipped"),
    supabase
      .from("job_applications")
      .select("id, status, created_at")
      .eq("applicant_id", user.id)
      .returns<JobApplicationRow[]>(),
    supabase
      .from("marketplace_orders")
      .select("id, status, price, created_at")
      .eq("buyer_id", user.id)
      .returns<MarketplaceOrderRow[]>(),
    getCreatorRequestStatus(user.id),
  ]);

  if (jobApplicationsActivityRes.error || ordersActivityRes.error) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-red-500">Failed to load your dashboard analytics.</p>
      </main>
    );
  }

  const profile = profileRes.data;
  const role = (profile?.role as Role | undefined) ?? "user";
  const displayName =
    profile?.full_name?.trim() ||
    profile?.username?.trim() ||
    user.email ||
    "there";

  const applications = jobApplicationsActivityRes.data ?? [];
  const orders = ordersActivityRes.data ?? [];
  const isLast30d = (iso: string) => new Date(iso).getTime() >= now - 30 * 24 * 60 * 60 * 1000;

  const applications30 = applications.filter((application) => isLast30d(application.created_at)).length;
  const totalApplications = jobAppsRes.count ?? 0;
  const acceptedApplications = acceptedAppsRes.count ?? 0;
  const applicationAcceptance =
    totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0;

  const paidOrders = orders.filter((order) => order.status === "paid").length;
  const shippedOrders = orders.filter((order) => order.status === "shipped").length;
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
  const orders30 = orders.filter((order) => isLast30d(order.created_at)).length;
  const spendTotal = orders.reduce((sum, order) => sum + toNumber(order.price), 0);
  const spend30 = orders
    .filter((order) => isLast30d(order.created_at))
    .reduce((sum, order) => sum + toNumber(order.price), 0);

  return (
    <main className="app-container py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">Welcome, {displayName}</h1>
        <p className="text-slate-600">
          Your learning, applications, orders, and account progress in one place.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled Courses" value={courseCountRes.count ?? 0} />
        <StatCard label="Enrollments (30d)" value={courseCount30Res.count ?? 0} />
        <StatCard label="Job Applications" value={jobAppsRes.count ?? 0} />
        <StatCard label="Applications (30d)" value={applications30} />
        <StatCard label="Pending Applications" value={pendingAppsRes.count ?? 0} />
        <StatCard label="Accepted Applications" value={acceptedAppsRes.count ?? 0} />
        <StatCard label="Acceptance Rate" value={`${applicationAcceptance.toFixed(1)}%`} />
        <StatCard label="Marketplace Orders" value={ordersRes.count ?? 0} />
        <StatCard label="Orders To Confirm" value={ordersToConfirmRes.count ?? 0} />
        <StatCard label="Total Spend" value={formatINR(spendTotal)} />
        <StatCard label="Spend (30d)" value={formatINR(spend30)} />
        <StatCard
          label="Creator Status"
          value={role === "creator" || role === "admin" ? role : creatorRequestStatus ?? "not applied"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="app-card rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Application Pipeline</h2>
          <MetricRow label="Total applications" value={totalApplications} />
          <MetricRow label="Pending" value={pendingAppsRes.count ?? 0} />
          <MetricRow label="Accepted" value={acceptedApplications} />
          <MetricRow
            label="Rejected"
            value={applications.filter((application) => application.status === "rejected").length}
          />
          <MetricRow label="Submitted in last 30d" value={applications30} />
        </section>

        <section className="app-card rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Marketplace Orders</h2>
          <MetricRow label="Paid" value={paidOrders} />
          <MetricRow label="Shipped" value={shippedOrders} />
          <MetricRow label="Delivered" value={deliveredOrders} />
          <MetricRow label="Orders in last 30d" value={orders30} />
          <MetricRow label="Average order value" value={formatINR(orders.length > 0 ? spendTotal / orders.length : 0)} />
        </section>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ActionPanel
          title="Learning"
          links={[
            { href: "/courses", label: "Browse Courses" },
            { href: "/my-courses", label: "My Courses" },
          ]}
        />

        <ActionPanel
          title="Jobs"
          links={[
            { href: "/jobs", label: "Explore Jobs" },
            { href: "/my-jobs", label: "My Applications" },
          ]}
        />

        <ActionPanel
          title="Marketplace"
          links={[
            { href: "/marketplace", label: "Browse Items" },
            { href: "/marketplace/orders", label: "My Orders" },
            { href: "/marketplace/my-items", label: "My Listings" },
          ]}
        />

        <ActionPanel
          title="Account"
          links={[
            { href: "/notifications", label: "Notifications" },
            { href: "/profile", label: "Edit Profile" },
            {
              href: role === "creator" || role === "admin" ? "/creator/dashboard" : "/creator/apply",
              label: role === "creator" || role === "admin" ? "Creator Dashboard" : "Apply as Creator",
            },
            ...(role === "admin" ? [{ href: "/admin/dashboard", label: "Admin Console" }] : []),
          ]}
        />
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="app-card rounded-xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ActionPanel({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <section className="app-card rounded-xl p-5 space-y-3">
      <h2 className="font-semibold">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50">
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function toNumber(value: number | string): number {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatINR(value: number): string {
  return `Rs ${Math.round(value).toLocaleString()}`;
}
