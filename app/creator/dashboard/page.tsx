import { requireCreator } from "@/lib/supabase/requireCreator";
import Link from "next/link";

export const dynamic = "force-dynamic";

type JobRow = {
  id: number;
  title: string;
  created_at: string;
  is_open: boolean;
  views: number | null;
  job_applications: { count: number }[];
};

type CourseRow = {
  id: number;
  title: string;
  status: string;
  created_at: string;
};

type ItemRow = {
  id: string;
  title: string;
  price: number | null;
  is_published: boolean;
  is_sold: boolean;
  created_at: string;
};

type OrderRow = {
  id: string;
  status: string;
  price: number;
  created_at: string;
  item: { title: string }[] | null;
};

export default async function CreatorDashboardPage() {
  const { user, supabase } = await requireCreator();

  const [
    jobsRes,
    coursesRes,
    itemsRes,
    ordersRes,
    enrollmentsCountRes,
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select(`
        id,
        title,
        created_at,
        is_open,
        views,
        job_applications(count)
      `)
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<JobRow[]>(),
    supabase
      .from("courses")
      .select("id, title, status, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<CourseRow[]>(),
    supabase
      .from("marketplace_items")
      .select("id, title, price, is_published, is_sold, created_at")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<ItemRow[]>(),
    supabase
      .from("marketplace_orders")
      .select(`
        id,
        status,
        price,
        created_at,
        item:marketplace_items(title)
      `)
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<OrderRow[]>(),
    supabase
      .from("course_enrollments")
      .select(
        `
        id,
        course:courses!inner(creator_id)
      `,
        { count: "exact", head: true }
      )
      .eq("course.creator_id", user.id),
  ]);

  if (jobsRes.error || coursesRes.error || itemsRes.error || ordersRes.error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load creator dashboard.
      </div>
    );
  }

  const jobs = jobsRes.data ?? [];
  const courses = coursesRes.data ?? [];
  const items = itemsRes.data ?? [];
  const orders = ordersRes.data ?? [];

  const totalViews = jobs.reduce((sum, job) => sum + (job.views ?? 0), 0);
  const totalApplications = jobs.reduce(
    (sum, job) => sum + (job.job_applications?.[0]?.count ?? 0),
    0
  );
  const conversionRate =
    totalViews > 0 ? ((totalApplications / totalViews) * 100).toFixed(1) : "0";

  const publishedCourses = courses.filter((course) => course.status === "published").length;
  const draftCourses = courses.length - publishedCourses;

  const publishedItems = items.filter((item) => item.is_published && !item.is_sold).length;
  const soldItems = items.filter((item) => item.is_sold).length;
  const paidOrders = orders.filter((order) => order.status === "paid").length;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-10">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-gray-600">
            Manage jobs, courses, marketplace items, and orders from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/creator/jobs/new"
            className="px-4 py-2 bg-black text-white rounded-md text-sm"
          >
            Post Job
          </Link>
          <Link href="/creator/courses/new" className="px-4 py-2 border rounded-md text-sm">
            Create Course
          </Link>
          <Link
            href="/creator/marketplace/new"
            className="px-4 py-2 border rounded-md text-sm"
          >
            Add Item
          </Link>
          <Link
            href="/creator/marketplace/orders"
            className="px-4 py-2 border rounded-md text-sm"
          >
            Manage Orders
          </Link>
          <Link href="/creator/analytics" className="px-4 py-2 border rounded-md text-sm">
            Analytics
          </Link>
        </div>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Job Views" value={totalViews} />
        <MetricCard title="Applications" value={totalApplications} />
        <MetricCard title="Conversion" value={`${conversionRate}%`} />
        <MetricCard title="Enrollments" value={enrollmentsCountRes.count ?? 0} />
        <MetricCard title="Courses" value={courses.length} />
        <MetricCard title="Published Courses" value={publishedCourses} />
        <MetricCard title="Live Listings" value={publishedItems} />
        <MetricCard title="Orders To Ship" value={paidOrders} />
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <Panel
          title="Recent Jobs"
          emptyText="No jobs yet."
          footerHref="/creator/jobs/new"
          footerLabel="Create first job"
        >
          {jobs.map((job) => {
            const applications = job.job_applications?.[0]?.count ?? 0;
            return (
              <div key={job.id} className="border rounded-lg p-3">
                <p className="font-medium">{job.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {job.is_open ? "Open" : "Closed"} · {applications} applications ·{" "}
                  {job.views ?? 0} views
                </p>
                <div className="mt-2 text-xs">
                  <Link href={`/creator/jobs/${job.id}`} className="underline">
                    Manage
                  </Link>
                  <span className="mx-2 text-gray-400">·</span>
                  <Link href={`/creator/jobs/${job.id}/applications`} className="underline">
                    Applications
                  </Link>
                </div>
              </div>
            );
          })}
        </Panel>

        <Panel
          title="Recent Courses"
          emptyText="No courses yet."
          footerHref="/creator/courses/new"
          footerLabel="Create first course"
        >
          {courses.map((course) => (
            <div key={course.id} className="border rounded-lg p-3">
              <p className="font-medium">{course.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {course.status} · {new Date(course.created_at).toLocaleDateString()}
              </p>
              <Link
                href={`/creator/courses/${course.id}`}
                className="text-xs underline mt-2 inline-block"
              >
                Manage
              </Link>
            </div>
          ))}
        </Panel>

        <Panel
          title="Marketplace"
          emptyText="No marketplace items yet."
          footerHref="/creator/marketplace/new"
          footerLabel="Add first item"
        >
          {items.map((item) => {
            let status = "Draft";
            if (item.is_sold) status = "Sold";
            else if (item.is_published) status = "Published";

            return (
              <div key={item.id} className="border rounded-lg p-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ₹{item.price ?? 0} · {status}
                </p>
                <Link
                  href={`/creator/marketplace/${item.id}`}
                  className="text-xs underline mt-2 inline-block"
                >
                  Manage
                </Link>
              </div>
            );
          })}
        </Panel>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Link href="/creator/marketplace/orders" className="text-sm underline">
            View all
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-gray-500">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border rounded-xl p-4 bg-white flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{order.item?.[0]?.title ?? "Unknown item"}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ₹{order.price} · {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="text-sm text-gray-600">
        <p>
          Draft Courses: {draftCourses} · Sold Items: {soldItems}
        </p>
      </section>
    </main>
  );
}

function MetricCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Panel({
  title,
  emptyText,
  footerHref,
  footerLabel,
  children,
}: {
  title: string;
  emptyText: string;
  footerHref: string;
  footerLabel: string;
  children: React.ReactNode[];
}) {
  const hasItems = children.length > 0;

  return (
    <section className="border rounded-xl p-5 bg-white space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hasItems ? children : <p className="text-sm text-gray-500">{emptyText}</p>}
      {!hasItems && (
        <Link href={footerHref} className="text-sm underline inline-block">
          {footerLabel}
        </Link>
      )}
    </section>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const statusClass =
    status === "paid"
      ? "bg-blue-100 text-blue-700"
      : status === "shipped"
        ? "bg-yellow-100 text-yellow-700"
        : status === "delivered"
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
      {status}
    </span>
  );
}
