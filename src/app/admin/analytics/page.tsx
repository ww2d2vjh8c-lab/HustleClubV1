import { requireAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

type MarketplaceOrderRow = {
  id: string;
  status: string;
  price: number | string;
  created_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
};

type CreatorRequestRow = {
  id: string;
  status: string;
  created_at: string;
  decided_at: string | null;
};

type JobApplicationRow = {
  id: string;
  status: string;
  created_at: string;
};

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireAdmin();
  const now = new Date().getTime();
  const thirtyDaysAgoISO = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sixtyDaysAgoISO = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [
    usersTotalRes,
    users30Res,
    usersPrev30Res,
    creatorsTotalRes,
    jobsTotalRes,
    jobsOpenRes,
    jobs30Res,
    jobsPrev30Res,
    coursesTotalRes,
    coursesPublishedRes,
    courses30Res,
    coursesPrev30Res,
    enrollmentsTotalRes,
    enrollments30Res,
    itemsTotalRes,
    itemsLiveRes,
    itemsSoldRes,
    ordersRes,
    creatorRequestsRes,
    applicationsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { head: true, count: "exact" }),
    supabase
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", thirtyDaysAgoISO),
    supabase
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", sixtyDaysAgoISO)
      .lt("created_at", thirtyDaysAgoISO),
    supabase
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .eq("role", "creator"),
    supabase.from("jobs").select("id", { head: true, count: "exact" }),
    supabase
      .from("jobs")
      .select("id", { head: true, count: "exact" })
      .eq("is_open", true),
    supabase
      .from("jobs")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", thirtyDaysAgoISO),
    supabase
      .from("jobs")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", sixtyDaysAgoISO)
      .lt("created_at", thirtyDaysAgoISO),
    supabase.from("courses").select("id", { head: true, count: "exact" }),
    supabase
      .from("courses")
      .select("id", { head: true, count: "exact" })
      .eq("status", "published"),
    supabase
      .from("courses")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", thirtyDaysAgoISO),
    supabase
      .from("courses")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", sixtyDaysAgoISO)
      .lt("created_at", thirtyDaysAgoISO),
    supabase.from("course_enrollments").select("id", { head: true, count: "exact" }),
    supabase
      .from("course_enrollments")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", thirtyDaysAgoISO),
    supabase.from("marketplace_items").select("id", { head: true, count: "exact" }),
    supabase
      .from("marketplace_items")
      .select("id", { head: true, count: "exact" })
      .eq("is_published", true)
      .eq("is_sold", false),
    supabase
      .from("marketplace_items")
      .select("id", { head: true, count: "exact" })
      .eq("is_sold", true),
    supabase
      .from("marketplace_orders")
      .select("id, status, price, created_at, shipped_at, delivered_at")
      .returns<MarketplaceOrderRow[]>(),
    supabase
      .from("creator_requests")
      .select("id, status, created_at, decided_at")
      .returns<CreatorRequestRow[]>(),
    supabase
      .from("job_applications")
      .select("id, status, created_at")
      .returns<JobApplicationRow[]>(),
  ]);

  if (
    usersTotalRes.error ||
    users30Res.error ||
    usersPrev30Res.error ||
    creatorsTotalRes.error ||
    jobsTotalRes.error ||
    jobsOpenRes.error ||
    jobs30Res.error ||
    jobsPrev30Res.error ||
    coursesTotalRes.error ||
    coursesPublishedRes.error ||
    courses30Res.error ||
    coursesPrev30Res.error ||
    enrollmentsTotalRes.error ||
    enrollments30Res.error ||
    itemsTotalRes.error ||
    itemsLiveRes.error ||
    itemsSoldRes.error ||
    ordersRes.error ||
    creatorRequestsRes.error ||
    applicationsRes.error
  ) {
    return (
      <main className="max-w-6xl mx-auto p-6">
        <p className="text-red-500">Failed to load admin analytics.</p>
      </main>
    );
  }

  const orders = ordersRes.data ?? [];
  const creatorRequests = creatorRequestsRes.data ?? [];
  const applications = applicationsRes.data ?? [];

  const isLast30d = (iso: string) => new Date(iso).getTime() >= now - 30 * 24 * 60 * 60 * 1000;
  const isPrev30d = (iso: string) => {
    const time = new Date(iso).getTime();
    return time >= now - 60 * 24 * 60 * 60 * 1000 && time < now - 30 * 24 * 60 * 60 * 1000;
  };

  const orders30 = orders.filter((order) => isLast30d(order.created_at)).length;
  const ordersPrev30 = orders.filter((order) => isPrev30d(order.created_at)).length;
  const paidOrders = orders.filter((order) => order.status === "paid").length;
  const shippedOrders = orders.filter((order) => order.status === "shipped").length;
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;

  const grossRevenue = orders.reduce((sum, order) => sum + toNumber(order.price), 0);
  const revenue30 = orders
    .filter((order) => isLast30d(order.created_at))
    .reduce((sum, order) => sum + toNumber(order.price), 0);
  const deliveredRevenue = orders
    .filter((order) => order.status === "delivered")
    .reduce((sum, order) => sum + toNumber(order.price), 0);
  const avgOrderValue = orders.length > 0 ? grossRevenue / orders.length : 0;

  const applications30 = applications.filter((application) => isLast30d(application.created_at)).length;
  const acceptedApplications = applications.filter((application) => application.status === "accepted").length;
  const pendingApplications = applications.filter((application) => application.status === "pending").length;
  const rejectedApplications = applications.filter((application) => application.status === "rejected").length;
  const applicationAcceptanceRate =
    applications.length > 0 ? (acceptedApplications / applications.length) * 100 : 0;

  const requestApproved = creatorRequests.filter((request) => request.status === "approved").length;
  const requestPending = creatorRequests.filter((request) => request.status === "pending").length;
  const requestRejected = creatorRequests.filter((request) => request.status === "rejected").length;
  const decidedRequests = creatorRequests.filter((request) => request.decided_at);
  const approvalRate =
    decidedRequests.length > 0 ? (requestApproved / decidedRequests.length) * 100 : 0;
  const avgReviewHours =
    decidedRequests.length > 0
      ? decidedRequests.reduce((sum, request) => {
          const created = new Date(request.created_at).getTime();
          const decided = new Date(request.decided_at as string).getTime();
          return sum + Math.max(0, decided - created);
        }, 0) /
        decidedRequests.length /
        36e5
      : 0;

  const totalUsers = usersTotalRes.count ?? 0;
  const users30 = users30Res.count ?? 0;
  const usersPrev30 = usersPrev30Res.count ?? 0;
  const jobsTotal = jobsTotalRes.count ?? 0;
  const jobs30 = jobs30Res.count ?? 0;
  const jobsPrev30 = jobsPrev30Res.count ?? 0;
  const courses30 = courses30Res.count ?? 0;
  const coursesPrev30 = coursesPrev30Res.count ?? 0;
  const creatorsTotal = creatorsTotalRes.count ?? 0;

  const cards = [
    { label: "Total Users", value: totalUsers, caption: `${users30} new in 30d` },
    { label: "Total Creators", value: creatorsTotal, caption: `${requestPending} requests pending` },
    { label: "Jobs", value: jobsTotal, caption: `${jobsOpenRes.count ?? 0} open jobs` },
    { label: "Courses", value: coursesTotalRes.count ?? 0, caption: `${coursesPublishedRes.count ?? 0} published` },
    { label: "Enrollments", value: enrollmentsTotalRes.count ?? 0, caption: `${enrollments30Res.count ?? 0} in 30d` },
    { label: "Marketplace Listings", value: itemsTotalRes.count ?? 0, caption: `${itemsLiveRes.count ?? 0} live / ${itemsSoldRes.count ?? 0} sold` },
    { label: "Orders", value: orders.length, caption: `${orders30} in 30d` },
    { label: "Gross Revenue", value: formatINR(grossRevenue), caption: `${formatINR(revenue30)} in 30d` },
    { label: "Average Order Value", value: formatINR(avgOrderValue), caption: `${deliveredOrders} delivered orders` },
    { label: "Job Applications", value: applications.length, caption: `${applications30} in 30d` },
    { label: "Creator Approval Rate", value: `${approvalRate.toFixed(1)}%`, caption: `${avgReviewHours.toFixed(1)}h avg review` },
    { label: "Application Acceptance", value: `${applicationAcceptanceRate.toFixed(1)}%`, caption: `${acceptedApplications} accepted` },
  ];

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Admin Analytics</h1>
        <p className="text-sm text-gray-600">Platform health, growth, and operational funnel metrics.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-gray-500">{card.caption}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="font-semibold">Growth Snapshot (last 30 days)</h2>
          <MetricRow label="User growth vs previous 30d" value={formatGrowth(users30, usersPrev30)} />
          <MetricRow label="Job growth vs previous 30d" value={formatGrowth(jobs30, jobsPrev30)} />
          <MetricRow label="Course growth vs previous 30d" value={formatGrowth(courses30, coursesPrev30)} />
          <MetricRow label="Order growth vs previous 30d" value={formatGrowth(orders30, ordersPrev30)} />
          <MetricRow label="Revenue (last 30d)" value={formatINR(revenue30)} />
        </div>

        <div className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="font-semibold">Marketplace Operations</h2>
          <MetricRow label="Paid / pending shipment" value={paidOrders} />
          <MetricRow label="Shipped" value={shippedOrders} />
          <MetricRow label="Delivered" value={deliveredOrders} />
          <MetricRow label="Delivered revenue" value={formatINR(deliveredRevenue)} />
          <MetricRow
            label="Delivery completion"
            value={orders.length > 0 ? `${((deliveredOrders / orders.length) * 100).toFixed(1)}%` : "0.0%"}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="font-semibold">Creator Requests</h2>
          <MetricRow label="Approved" value={requestApproved} />
          <MetricRow label="Pending" value={requestPending} />
          <MetricRow label="Rejected" value={requestRejected} />
          <MetricRow label="Approval rate (decided only)" value={`${approvalRate.toFixed(1)}%`} />
          <MetricRow label="Average review time" value={`${avgReviewHours.toFixed(1)} hours`} />
        </div>

        <div className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="font-semibold">Job Applications Funnel</h2>
          <MetricRow label="Pending" value={pendingApplications} />
          <MetricRow label="Accepted" value={acceptedApplications} />
          <MetricRow label="Rejected" value={rejectedApplications} />
          <MetricRow label="Applications in 30d" value={applications30} />
          <MetricRow label="Acceptance rate" value={`${applicationAcceptanceRate.toFixed(1)}%`} />
        </div>
      </section>
    </main>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
      <span className="text-sm text-gray-600">{label}</span>
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

function formatGrowth(current: number, previous: number): string {
  if (previous === 0 && current === 0) return "0.0%";
  if (previous === 0) return "+100.0%";
  const diff = ((current - previous) / previous) * 100;
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff.toFixed(1)}%`;
}
