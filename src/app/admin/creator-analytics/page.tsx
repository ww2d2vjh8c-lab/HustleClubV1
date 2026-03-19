import StatCard from "@/components/admin/StatCard";
import { requireAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

type CreatorProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  created_at: string;
};

type JobRow = {
  id: number;
  creator_id: string | null;
  title: string;
  is_open: boolean;
  views: number | null;
  created_at: string;
};

type JobApplicationRow = {
  id: string;
  job_id: number;
  status: string;
  created_at: string;
};

type CourseRow = {
  id: number;
  creator_id: string;
  title: string;
  status: string;
  created_at: string;
};

type CourseEnrollmentRow = {
  id: number;
  course_id: number;
  created_at: string;
};

type MarketplaceItemRow = {
  id: string;
  seller_id: string | null;
  title: string;
  is_published: boolean;
  is_sold: boolean;
  created_at: string;
};

type MarketplaceOrderRow = {
  id: string;
  seller_id: string;
  status: string;
  price: number | string;
  created_at: string;
};

type CreatorRequestRow = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  decided_at: string | null;
};

type CreatorAggregate = {
  creator: CreatorProfileRow;
  jobs: number;
  openJobs: number;
  views: number;
  applications: number;
  acceptedApplications: number;
  courses: number;
  publishedCourses: number;
  enrollments: number;
  listings: number;
  liveListings: number;
  soldListings: number;
  orders: number;
  deliveredOrders: number;
  revenue: number;
  activitySignals30d: number;
};

export default async function CreatorAnalyticsPage() {
  const { supabase } = await requireAdmin();
  const now = new Date().getTime();
  const last30d = now - 30 * 24 * 60 * 60 * 1000;

  const { data: creators, error: creatorsError } = await supabase
    .from("profiles")
    .select("id, full_name, username, email, created_at")
    .eq("role", "creator")
    .returns<CreatorProfileRow[]>();

  if (creatorsError) {
    return (
      <main className="max-w-6xl mx-auto p-6">
        <p className="text-red-500">Failed to load creator analytics.</p>
      </main>
    );
  }

  const creatorList = creators ?? [];
  const creatorIds = creatorList.map((creator) => creator.id);

  const aggregateMap = new Map<string, CreatorAggregate>();
  for (const creator of creatorList) {
    aggregateMap.set(creator.id, {
      creator,
      jobs: 0,
      openJobs: 0,
      views: 0,
      applications: 0,
      acceptedApplications: 0,
      courses: 0,
      publishedCourses: 0,
      enrollments: 0,
      listings: 0,
      liveListings: 0,
      soldListings: 0,
      orders: 0,
      deliveredOrders: 0,
      revenue: 0,
      activitySignals30d: 0,
    });
  }

  if (creatorIds.length === 0) {
    return (
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Creator Analytics</h1>
          <p className="text-sm text-gray-600">No creator profiles yet.</p>
        </header>
      </main>
    );
  }

  const [jobsRes, coursesRes, itemsRes, ordersRes, requestsRes] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, creator_id, title, is_open, views, created_at")
      .in("creator_id", creatorIds)
      .returns<JobRow[]>(),
    supabase
      .from("courses")
      .select("id, creator_id, title, status, created_at")
      .in("creator_id", creatorIds)
      .returns<CourseRow[]>(),
    supabase
      .from("marketplace_items")
      .select("id, seller_id, title, is_published, is_sold, created_at")
      .in("seller_id", creatorIds)
      .returns<MarketplaceItemRow[]>(),
    supabase
      .from("marketplace_orders")
      .select("id, seller_id, status, price, created_at")
      .in("seller_id", creatorIds)
      .returns<MarketplaceOrderRow[]>(),
    supabase
      .from("creator_requests")
      .select("id, user_id, status, created_at, decided_at")
      .in("user_id", creatorIds)
      .returns<CreatorRequestRow[]>(),
  ]);

  if (jobsRes.error || coursesRes.error || itemsRes.error || ordersRes.error || requestsRes.error) {
    return (
      <main className="max-w-6xl mx-auto p-6">
        <p className="text-red-500">Failed to load creator performance metrics.</p>
      </main>
    );
  }

  const jobs = jobsRes.data ?? [];
  const courses = coursesRes.data ?? [];
  const items = itemsRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const requests = requestsRes.data ?? [];

  const jobIds = jobs.map((job) => job.id);
  const courseIds = courses.map((course) => course.id);

  let applications: JobApplicationRow[] = [];
  let enrollments: CourseEnrollmentRow[] = [];

  if (jobIds.length > 0) {
    const { data, error } = await supabase
      .from("job_applications")
      .select("id, job_id, status, created_at")
      .in("job_id", jobIds)
      .returns<JobApplicationRow[]>();

    if (error) {
      return (
        <main className="max-w-6xl mx-auto p-6">
          <p className="text-red-500">Failed to load creator application analytics.</p>
        </main>
      );
    }
    applications = data ?? [];
  }

  if (courseIds.length > 0) {
    const { data, error } = await supabase
      .from("course_enrollments")
      .select("id, course_id, created_at")
      .in("course_id", courseIds)
      .returns<CourseEnrollmentRow[]>();

    if (error) {
      return (
        <main className="max-w-6xl mx-auto p-6">
          <p className="text-red-500">Failed to load creator enrollment analytics.</p>
        </main>
      );
    }
    enrollments = data ?? [];
  }

  const touch30d = (id: string, isoDate: string) => {
    if (new Date(isoDate).getTime() < last30d) return;
    const creator = aggregateMap.get(id);
    if (!creator) return;
    creator.activitySignals30d += 1;
  };

  const jobOwnerMap = new Map<number, string>();
  const courseOwnerMap = new Map<number, string>();

  for (const job of jobs) {
    if (!job.creator_id) continue;
    const creator = aggregateMap.get(job.creator_id);
    if (!creator) continue;
    creator.jobs += 1;
    creator.views += job.views ?? 0;
    if (job.is_open) creator.openJobs += 1;
    jobOwnerMap.set(job.id, job.creator_id);
    touch30d(job.creator_id, job.created_at);
  }

  for (const course of courses) {
    const creator = aggregateMap.get(course.creator_id);
    if (!creator) continue;
    creator.courses += 1;
    if (course.status === "published") creator.publishedCourses += 1;
    courseOwnerMap.set(course.id, course.creator_id);
    touch30d(course.creator_id, course.created_at);
  }

  for (const item of items) {
    if (!item.seller_id) continue;
    const creator = aggregateMap.get(item.seller_id);
    if (!creator) continue;
    creator.listings += 1;
    if (item.is_published && !item.is_sold) creator.liveListings += 1;
    if (item.is_sold) creator.soldListings += 1;
    touch30d(item.seller_id, item.created_at);
  }

  for (const order of orders) {
    const creator = aggregateMap.get(order.seller_id);
    if (!creator) continue;
    creator.orders += 1;
    creator.revenue += toNumber(order.price);
    if (order.status === "delivered") creator.deliveredOrders += 1;
    touch30d(order.seller_id, order.created_at);
  }

  for (const application of applications) {
    const creatorId = jobOwnerMap.get(application.job_id);
    if (!creatorId) continue;
    const creator = aggregateMap.get(creatorId);
    if (!creator) continue;
    creator.applications += 1;
    if (application.status === "accepted") creator.acceptedApplications += 1;
    touch30d(creatorId, application.created_at);
  }

  for (const enrollment of enrollments) {
    const creatorId = courseOwnerMap.get(enrollment.course_id);
    if (!creatorId) continue;
    const creator = aggregateMap.get(creatorId);
    if (!creator) continue;
    creator.enrollments += 1;
    touch30d(creatorId, enrollment.created_at);
  }

  const aggregates = [...aggregateMap.values()];
  const totalCreators = aggregates.length;
  const activeCreators = aggregates.filter((creator) => creator.activitySignals30d > 0).length;
  const creatorsWithRevenue = aggregates.filter((creator) => creator.revenue > 0).length;
  const totalRevenue = aggregates.reduce((sum, creator) => sum + creator.revenue, 0);
  const totalApplications = aggregates.reduce((sum, creator) => sum + creator.applications, 0);
  const totalEnrollments = aggregates.reduce((sum, creator) => sum + creator.enrollments, 0);
  const averageJobs = totalCreators > 0 ? aggregates.reduce((sum, creator) => sum + creator.jobs, 0) / totalCreators : 0;
  const averageListings =
    totalCreators > 0 ? aggregates.reduce((sum, creator) => sum + creator.listings, 0) / totalCreators : 0;

  const approvedRequests = requests.filter((request) => request.status === "approved").length;
  const pendingRequests = requests.filter((request) => request.status === "pending").length;
  const decidedRequests = requests.filter((request) => request.decided_at);
  const avgRequestReviewHours =
    decidedRequests.length > 0
      ? decidedRequests.reduce((sum, request) => {
          const start = new Date(request.created_at).getTime();
          const end = new Date(request.decided_at as string).getTime();
          return sum + Math.max(0, end - start);
        }, 0) /
        decidedRequests.length /
        36e5
      : 0;

  const topByRevenue = [...aggregates].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const topByApplications = [...aggregates].sort((a, b) => b.applications - a.applications).slice(0, 8);
  const topByEnrollments = [...aggregates].sort((a, b) => b.enrollments - a.enrollments).slice(0, 8);
  const atRiskCreators = [...aggregates]
    .filter((creator) => creator.activitySignals30d === 0)
    .sort((a, b) => a.jobs + a.courses + a.listings - (b.jobs + b.courses + b.listings))
    .slice(0, 8);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Creator Analytics</h1>
        <p className="text-sm text-gray-600">Creator output, demand, and monetization performance.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Total Creators" value={totalCreators} />
        <StatCard label="Active Creators (30d)" value={activeCreators} />
        <StatCard label="Creators With Revenue" value={creatorsWithRevenue} />
        <StatCard label="Total Creator Revenue" value={formatINR(totalRevenue)} />
        <StatCard label="Total Applications" value={totalApplications} />
        <StatCard label="Total Enrollments" value={totalEnrollments} />
        <StatCard label="Avg Jobs / Creator" value={averageJobs.toFixed(1)} />
        <StatCard label="Avg Listings / Creator" value={averageListings.toFixed(1)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <LeaderboardPanel title="Top Creators by Revenue" creators={topByRevenue} value="revenue" />
        <LeaderboardPanel title="Top Creators by Job Demand" creators={topByApplications} value="applications" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <LeaderboardPanel title="Top Creators by Course Demand" creators={topByEnrollments} value="enrollments" />
        <InactivePanel creators={atRiskCreators} />
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-3">
        <h2 className="font-semibold">Creator Onboarding Quality</h2>
        <MetricRow label="Approved requests (from creators)" value={approvedRequests} />
        <MetricRow label="Pending requests (from creators)" value={pendingRequests} />
        <MetricRow
          label="Approval rate"
          value={decidedRequests.length > 0 ? `${((approvedRequests / decidedRequests.length) * 100).toFixed(1)}%` : "0.0%"}
        />
        <MetricRow label="Average review time" value={`${avgRequestReviewHours.toFixed(1)} hours`} />
      </section>
    </main>
  );
}

function LeaderboardPanel({
  title,
  creators,
  value,
}: {
  title: string;
  creators: CreatorAggregate[];
  value: "revenue" | "applications" | "enrollments";
}) {
  return (
    <section className="rounded-xl border bg-white p-5 space-y-4">
      <h2 className="font-semibold">{title}</h2>
      {creators.length === 0 ? (
        <p className="text-sm text-gray-500">No data yet.</p>
      ) : (
        <div className="space-y-2">
          {creators.map((creator, index) => {
            const display = creator.creator.full_name || creator.creator.username || creator.creator.email || creator.creator.id;
            const metricValue =
              value === "revenue"
                ? formatINR(creator.revenue)
                : value === "applications"
                  ? creator.applications
                  : creator.enrollments;

            return (
              <div key={creator.creator.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">
                    #{index + 1} {display}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Jobs: {creator.jobs} - Courses: {creator.courses} - Listings: {creator.listings}
                  </p>
                </div>
                <p className="font-semibold">{metricValue}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function InactivePanel({ creators }: { creators: CreatorAggregate[] }) {
  return (
    <section className="rounded-xl border bg-white p-5 space-y-4">
      <h2 className="font-semibold">Creators With No Activity in 30d</h2>
      {creators.length === 0 ? (
        <p className="text-sm text-gray-500">All creators are active this month.</p>
      ) : (
        <div className="space-y-2">
          {creators.map((creator) => {
            const display = creator.creator.full_name || creator.creator.username || creator.creator.email || creator.creator.id;
            return (
              <div key={creator.creator.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span>{display}</span>
                <span className="text-gray-500">
                  {creator.jobs + creator.courses + creator.listings} total assets
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
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
