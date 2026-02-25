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

export default async function CreatorDashboardPage() {
  const { user, supabase } = await requireCreator();

  const { data: jobs, error } = await supabase
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
    .returns<JobRow[]>();

  if (error) {
    console.log("DASHBOARD ERROR:", error);
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load dashboard.
      </div>
    );
  }

  const totalViews =
    jobs?.reduce((sum, job) => sum + (job.views ?? 0), 0) ?? 0;

  const totalApplications =
    jobs?.reduce(
      (sum, job) =>
        sum + (job.job_applications?.[0]?.count ?? 0),
      0
    ) ?? 0;

  const overallConversion =
    totalViews > 0
      ? ((totalApplications / totalViews) * 100).toFixed(1)
      : "0";

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-12">
      
      {/* ================= HEADER ================= */}
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">
            Creator Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your platform content and track performance
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/creator/jobs/new"
            className="px-4 py-2 bg-black text-white rounded-md text-sm"
          >
            Post Job
          </Link>

          <Link
            href="/creator/courses"
            className="px-4 py-2 border rounded-md text-sm"
          >
            Manage Courses
          </Link>

          <Link
            href="/creator/marketplace"
            className="px-4 py-2 border rounded-md text-sm"
          >
            Manage Marketplace
          </Link>

          <Link
            href="/creator/analytics"
            className="px-4 py-2 border rounded-md text-sm"
          >
            Analytics
          </Link>
        </div>
      </header>

      {/* ================= OVERALL ANALYTICS ================= */}
      <section className="grid md:grid-cols-3 gap-6">
        <AnalyticsCard title="Total Views" value={totalViews} />
        <AnalyticsCard
          title="Total Applications"
          value={totalApplications}
        />
        <AnalyticsCard
          title="Overall Conversion"
          value={`${overallConversion}%`}
        />
      </section>

      {/* ================= JOB SECTION ================= */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">
          Your Jobs
        </h2>

        {(!jobs || jobs.length === 0) && (
          <p className="text-gray-500">
            You haven’t posted any jobs yet.
          </p>
        )}

        <div className="space-y-4">
          {jobs?.map((job) => {
            const applications =
              job.job_applications?.[0]?.count ?? 0;

            const views = job.views ?? 0;

            const conversion =
              views > 0
                ? ((applications / views) * 100).toFixed(1)
                : "0";

            return (
              <div
                key={job.id}
                className="border rounded-xl p-6 bg-white hover:shadow-sm transition space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">
                      {job.title}
                    </h3>

                    <p className="text-sm text-gray-500">
                      Posted on{" "}
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>

                    <p className="text-xs">
                      Status:{" "}
                      <span
                        className={
                          job.is_open
                            ? "text-green-600"
                            : "text-gray-400"
                        }
                      >
                        {job.is_open ? "Open" : "Closed"}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <Link
                      href={`/creator/jobs/${job.id}`}
                      className="underline"
                    >
                      Manage Job
                    </Link>

                    <Link
                      href={`/creator/jobs/${job.id}/applications`}
                      className="underline"
                    >
                      View Applications
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-gray-500">Views</p>
                    <p className="font-semibold text-lg">
                      {views}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Applications</p>
                    <p className="font-semibold text-lg">
                      {applications}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Conversion Rate
                    </p>
                    <p className="font-semibold text-lg">
                      {conversion}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </main>
  );
}

/* ================= REUSABLE CARD ================= */

function AnalyticsCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <div className="border rounded-xl p-6 bg-white shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}