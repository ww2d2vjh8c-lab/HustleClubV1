import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { getCreatorRequestStatus } from "@/lib/creator/getCreatorRequestStatus";

export const dynamic = "force-dynamic";

type Role = "user" | "creator" | "admin";

export default async function UserDashboardPage() {
  const { user, supabase } = await requireUser();

  const [
    profileRes,
    courseCountRes,
    jobAppsRes,
    pendingAppsRes,
    acceptedAppsRes,
    ordersRes,
    ordersToConfirmRes,
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
    getCreatorRequestStatus(user.id),
  ]);

  const profile = profileRes.data;
  const role = (profile?.role as Role | undefined) ?? "user";
  const displayName =
    profile?.full_name?.trim() ||
    profile?.username?.trim() ||
    user.email ||
    "there";

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome, {displayName}</h1>
        <p className="text-gray-600">
          Your learning, applications, orders, and account progress in one place.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled Courses" value={courseCountRes.count ?? 0} />
        <StatCard label="Job Applications" value={jobAppsRes.count ?? 0} />
        <StatCard label="Pending Applications" value={pendingAppsRes.count ?? 0} />
        <StatCard label="Accepted Applications" value={acceptedAppsRes.count ?? 0} />
        <StatCard label="Marketplace Orders" value={ordersRes.count ?? 0} />
        <StatCard label="Orders To Confirm" value={ordersToConfirmRes.count ?? 0} />
        <StatCard
          label="Creator Status"
          value={role === "creator" || role === "admin" ? role : creatorRequestStatus ?? "not applied"}
        />
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
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
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
    <section className="rounded-xl border bg-white p-5 space-y-3">
      <h2 className="font-semibold">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50">
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
