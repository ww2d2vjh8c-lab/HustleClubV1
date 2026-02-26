import { requireCreator } from "@/lib/supabase/requireCreator";

export const dynamic = "force-dynamic";

type JobRow = {
  id: number;
  title: string;
  views: number | null;
  is_open: boolean;
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
  title: string;
  price: number | string | null;
  is_published: boolean;
  is_sold: boolean;
  created_at: string;
};

type MarketplaceOrderRow = {
  id: string;
  item_id: string;
  status: string;
  price: number | string;
  created_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
};

type JobViewRow = {
  id: number;
  job_id: number;
  viewed_at: string;
};

type JobIpViewRow = {
  id: number;
  job_id: number;
  country: string | null;
  viewed_at: string;
};

type DailyPoint = {
  day: string;
  label: string;
  count: number;
};

type CreatorMetric = {
  title: string;
  value: string | number;
  caption?: string;
};

export default async function CreatorAnalyticsPage() {
  const { user, supabase } = await requireCreator();

  const [
    jobsRes,
    coursesRes,
    itemsRes,
    ordersRes,
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, views, is_open, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .returns<JobRow[]>(),
    supabase
      .from("courses")
      .select("id, title, status, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .returns<CourseRow[]>(),
    supabase
      .from("marketplace_items")
      .select("id, title, price, is_published, is_sold, created_at")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .returns<MarketplaceItemRow[]>(),
    supabase
      .from("marketplace_orders")
      .select("id, item_id, status, price, created_at, shipped_at, delivered_at")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .returns<MarketplaceOrderRow[]>(),
  ]);

  if (jobsRes.error || coursesRes.error || itemsRes.error || ordersRes.error) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <p className="text-red-500">Failed to load creator analytics.</p>
      </main>
    );
  }

  const jobs = jobsRes.data ?? [];
  const courses = coursesRes.data ?? [];
  const items = itemsRes.data ?? [];
  const orders = ordersRes.data ?? [];

  const jobIds = jobs.map((job) => job.id);
  const courseIds = courses.map((course) => course.id);

  let applications: JobApplicationRow[] = [];
  let enrollments: CourseEnrollmentRow[] = [];
  let userViews: JobViewRow[] = [];
  let ipViews: JobIpViewRow[] = [];

  if (jobIds.length > 0) {
    const [appsRes, userViewsRes, ipViewsRes] = await Promise.all([
      supabase
        .from("job_applications")
        .select("id, job_id, status, created_at")
        .in("job_id", jobIds)
        .returns<JobApplicationRow[]>(),
      supabase
        .from("job_views")
        .select("id, job_id, viewed_at")
        .in("job_id", jobIds)
        .returns<JobViewRow[]>(),
      supabase
        .from("job_ip_views")
        .select("id, job_id, country, viewed_at")
        .in("job_id", jobIds)
        .returns<JobIpViewRow[]>(),
    ]);

    if (appsRes.error || userViewsRes.error || ipViewsRes.error) {
      return (
        <main className="max-w-5xl mx-auto p-6">
          <p className="text-red-500">Failed to load creator analytics details.</p>
        </main>
      );
    }

    applications = appsRes.data ?? [];
    userViews = userViewsRes.data ?? [];
    ipViews = ipViewsRes.data ?? [];
  }

  if (courseIds.length > 0) {
    const { data, error } = await supabase
      .from("course_enrollments")
      .select("id, course_id, created_at")
      .in("course_id", courseIds)
      .returns<CourseEnrollmentRow[]>();

    if (error) {
      return (
        <main className="max-w-5xl mx-auto p-6">
          <p className="text-red-500">Failed to load course analytics.</p>
        </main>
      );
    }

    enrollments = data ?? [];
  }

  const now = new Date().getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const last7d = now - 7 * oneDayMs;
  const last30d = now - 30 * oneDayMs;

  const isSince = (iso: string, threshold: number) => new Date(iso).getTime() >= threshold;
  const totalViews = jobs.reduce((sum, job) => sum + (job.views ?? 0), 0);
  const viewEvents = [...userViews, ...ipViews];
  const views7d = viewEvents.filter((event) => isSince(event.viewed_at, last7d)).length;
  const views30d = viewEvents.filter((event) => isSince(event.viewed_at, last30d)).length;

  const applications7d = applications.filter((app) => isSince(app.created_at, last7d)).length;
  const applications30d = applications.filter((app) => isSince(app.created_at, last30d)).length;
  const acceptedApplications = applications.filter((app) => app.status === "accepted").length;
  const pendingApplications = applications.filter((app) => app.status === "pending").length;
  const rejectedApplications = applications.filter((app) => app.status === "rejected").length;

  const enrollments30d = enrollments.filter((enrollment) =>
    isSince(enrollment.created_at, last30d)
  ).length;

  const paidOrders = orders.filter((order) => order.status === "paid").length;
  const shippedOrders = orders.filter((order) => order.status === "shipped").length;
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
  const orders30d = orders.filter((order) => isSince(order.created_at, last30d)).length;

  const revenueTotal = orders.reduce((sum, order) => sum + toNumber(order.price), 0);
  const revenue30d = orders
    .filter((order) => isSince(order.created_at, last30d))
    .reduce((sum, order) => sum + toNumber(order.price), 0);

  const conversionRate = totalViews > 0 ? (applications.length / totalViews) * 100 : 0;
  const acceptanceRate =
    applications.length > 0 ? (acceptedApplications / applications.length) * 100 : 0;
  const fulfillmentRate = orders.length > 0 ? (deliveredOrders / orders.length) * 100 : 0;

  const publishedCourses = courses.filter((course) => course.status === "published").length;
  const draftCourses = courses.filter((course) => course.status !== "published").length;
  const liveListings = items.filter((item) => item.is_published && !item.is_sold).length;
  const soldListings = items.filter((item) => item.is_sold).length;

  const perJobApplications = new Map<number, number>();
  const perJobAccepted = new Map<number, number>();

  for (const app of applications) {
    perJobApplications.set(app.job_id, (perJobApplications.get(app.job_id) ?? 0) + 1);
    if (app.status === "accepted") {
      perJobAccepted.set(app.job_id, (perJobAccepted.get(app.job_id) ?? 0) + 1);
    }
  }

  const topJobs = jobs
    .map((job) => {
      const applicationsCount = perJobApplications.get(job.id) ?? 0;
      const acceptedCount = perJobAccepted.get(job.id) ?? 0;
      const views = job.views ?? 0;
      const cv = views > 0 ? (applicationsCount / views) * 100 : 0;

      return {
        id: job.id,
        title: job.title,
        isOpen: job.is_open,
        views,
        applications: applicationsCount,
        accepted: acceptedCount,
        conversion: cv,
      };
    })
    .sort((a, b) => b.applications - a.applications || b.views - a.views)
    .slice(0, 6);

  const perCourseEnrollments = new Map<number, number>();
  for (const enrollment of enrollments) {
    perCourseEnrollments.set(
      enrollment.course_id,
      (perCourseEnrollments.get(enrollment.course_id) ?? 0) + 1
    );
  }

  const topCourses = courses
    .map((course) => ({
      id: course.id,
      title: course.title,
      status: course.status,
      enrollments: perCourseEnrollments.get(course.id) ?? 0,
    }))
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 6);

  const countryCounts = new Map<string, number>();
  for (const row of ipViews) {
    const country = row.country?.trim() || "Unknown";
    countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
  }
  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const dailyViews = buildDailySeries(
    14,
    viewEvents.map((event) => event.viewed_at)
  );
  const dailyApplications = buildDailySeries(
    14,
    applications.map((app) => app.created_at)
  );
  const dailyOrders = buildDailySeries(
    14,
    orders.map((order) => order.created_at)
  );

  const metrics: CreatorMetric[] = [
    { title: "Total Views", value: totalViews, caption: `${views30d} in last 30 days` },
    { title: "Applications", value: applications.length, caption: `${applications30d} in last 30 days` },
    { title: "Enrollments", value: enrollments.length, caption: `${enrollments30d} in last 30 days` },
    { title: "Revenue", value: formatINR(revenueTotal), caption: `${formatINR(revenue30d)} in last 30 days` },
    { title: "Jobs", value: jobs.length, caption: `${jobs.filter((job) => job.is_open).length} open` },
    { title: "Courses", value: courses.length, caption: `${publishedCourses} published / ${draftCourses} draft` },
    { title: "Listings", value: items.length, caption: `${liveListings} live / ${soldListings} sold` },
    { title: "Orders", value: orders.length, caption: `${paidOrders} to ship / ${shippedOrders} shipped` },
    { title: "View -> Apply", value: `${conversionRate.toFixed(1)}%`, caption: `${applications7d} applications in last 7 days` },
    { title: "Acceptance Rate", value: `${acceptanceRate.toFixed(1)}%`, caption: `${acceptedApplications} accepted` },
    { title: "Fulfillment Rate", value: `${fulfillmentRate.toFixed(1)}%`, caption: `${deliveredOrders} delivered` },
    { title: "Views (7d)", value: views7d, caption: "Unique and anonymous view events" },
  ];

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Creator Analytics</h1>
        <p className="text-gray-600">
          Track real funnel metrics for jobs, courses, and marketplace performance.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} title={metric.title} value={metric.value} caption={metric.caption} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <TrendCard title="Views (14 days)" series={dailyViews} />
        <TrendCard title="Applications (14 days)" series={dailyApplications} />
        <TrendCard title="Orders (14 days)" series={dailyOrders} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top Jobs">
          {topJobs.length === 0 ? (
            <p className="text-sm text-gray-500">No jobs yet.</p>
          ) : (
            <div className="space-y-3">
              {topJobs.map((job) => (
                <div key={job.id} className="rounded-lg border p-3">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {job.isOpen ? "Open" : "Closed"} - {job.views} views - {job.applications} applications
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Accepted: {job.accepted} - Conversion: {job.conversion.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Top Courses">
          {topCourses.length === 0 ? (
            <p className="text-sm text-gray-500">No courses yet.</p>
          ) : (
            <div className="space-y-3">
              {topCourses.map((course) => (
                <div key={course.id} className="rounded-lg border p-3">
                  <p className="font-medium">{course.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {course.status} - {course.enrollments} enrollments
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Audience Geography">
          {topCountries.length === 0 ? (
            <p className="text-sm text-gray-500">No country data yet.</p>
          ) : (
            <div className="space-y-3">
              {topCountries.map(([country, count]) => (
                <div key={country} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span>{country}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Application and Order Pipeline">
          <div className="space-y-3 text-sm">
            <Row label="Applications - Pending" value={pendingApplications} />
            <Row label="Applications - Accepted" value={acceptedApplications} />
            <Row label="Applications - Rejected" value={rejectedApplications} />
            <Row label="Orders - Paid" value={paidOrders} />
            <Row label="Orders - Shipped" value={shippedOrders} />
            <Row label="Orders - Delivered" value={deliveredOrders} />
            <Row label="Orders in last 30 days" value={orders30d} />
          </div>
        </Panel>
      </section>
    </main>
  );
}

function MetricCard({
  title,
  value,
  caption,
}: {
  title: string;
  value: string | number;
  caption?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {caption ? <p className="mt-1 text-xs text-gray-500">{caption}</p> : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-5 space-y-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function TrendCard({ title, series }: { title: string; series: DailyPoint[] }) {
  const max = Math.max(...series.map((point) => point.count), 1);

  return (
    <section className="rounded-xl border bg-white p-5 space-y-3">
      <h2 className="font-semibold">{title}</h2>
      <div className="space-y-2">
        {series.map((point) => (
          <div key={point.day} className="grid grid-cols-[34px_1fr_28px] items-center gap-2 text-xs">
            <span className="text-gray-500">{point.label}</span>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-black/70"
                style={{ width: `${Math.max((point.count / max) * 100, point.count > 0 ? 8 : 0)}%` }}
              />
            </div>
            <span className="text-right font-medium">{point.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildDailySeries(days: number, dates: string[]): DailyPoint[] {
  const counts = new Map<string, number>();
  const list: DailyPoint[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(new Date().getTime() - i * 24 * 60 * 60 * 1000);
    const key = day.toISOString().slice(0, 10);
    counts.set(key, 0);
    list.push({
      day: key,
      label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: 0,
    });
  }

  for (const isoDate of dates) {
    const key = isoDate.slice(0, 10);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return list.map((point) => ({
    ...point,
    count: counts.get(point.day) ?? 0,
  }));
}

function toNumber(value: number | string | null): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatINR(value: number): string {
  return `Rs ${Math.round(value).toLocaleString()}`;
}
