import { requireCreator } from "@/lib/supabase/requireCreator";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type JobRow = {
  id: number;
  title: string;
  views: number | null;
};

type GeoViewRow = {
  country: string | null;
  job:
    | {
        creator_id: string;
      }
    | {
        creator_id: string;
      }[]
    | null;
};

export default async function CreatorAnalyticsPage() {
  const { user } = await requireCreator();
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const twentyFourHoursAgo = new Date(
    now.getTime() - 24 * 60 * 60 * 1000
  ).toISOString();

  /* ================= COURSES ================= */

  const { count: totalCourses } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", user.id);

  const { count: totalEnrollments } = await supabase
    .from("course_enrollments")
    .select(
      `
      id,
      course:courses!inner(creator_id)
    `,
      { count: "exact", head: true }
    )
    .eq("course.creator_id", user.id);

  /* ================= JOBS ================= */

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, views")
    .eq("creator_id", user.id)
    .returns<JobRow[]>();

  const { count: totalApplications } = await supabase
    .from("job_applications")
    .select(
      `
      id,
      job:jobs!inner(creator_id)
    `,
      { count: "exact", head: true }
    )
    .eq("job.creator_id", user.id);

  /* ================= 24H VIEWS ================= */

  const { count: userViews24h } = await supabase
    .from("job_views")
    .select(
      `
      id,
      job:jobs!inner(creator_id)
    `,
      { count: "exact", head: true }
    )
    .eq("job.creator_id", user.id)
    .gte("viewed_at", twentyFourHoursAgo);

  const { count: ipViews24h } = await supabase
    .from("job_ip_views")
    .select(
      `
      id,
      job:jobs!inner(creator_id)
    `,
      { count: "exact", head: true }
    )
    .eq("job.creator_id", user.id)
    .gte("viewed_at", twentyFourHoursAgo);

  const totalViews =
    jobs?.reduce((sum, job) => sum + (job.views ?? 0), 0) ?? 0;

  const views24h =
    (userViews24h ?? 0) + (ipViews24h ?? 0);

  const conversionRate =
    totalViews > 0
      ? ((totalApplications ?? 0) / totalViews * 100).toFixed(1)
      : "0";

  /* ================= GEO ================= */

  const { data: geoData } = await supabase
    .from("job_ip_views")
    .select(
      `
      country,
      job:jobs!inner(creator_id)
    `
    )
    .eq("job.creator_id", user.id)
    .limit(1000)
    .returns<GeoViewRow[]>();

  const countryCounts: Record<string, number> = {};

  geoData?.forEach((row) => {
    const country = row.country || "unknown";
    countryCounts[country] =
      (countryCounts[country] || 0) + 1;
  });

  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <main className="max-w-6xl mx-auto p-8 space-y-12">
      <header>
        <h1 className="text-3xl font-bold">
          Creator Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          24h traffic, conversion & geo insights
        </p>
      </header>

      {/* ================= SUMMARY CARDS ================= */}
      <section className="grid md:grid-cols-6 gap-6">
        <AnalyticsCard
          title="Total Views"
          value={totalViews}
        />

        <AnalyticsCard
          title="24h Views"
          value={views24h}
        />

        <AnalyticsCard
          title="Applications"
          value={totalApplications ?? 0}
        />

        <AnalyticsCard
          title="Enrollments"
          value={totalEnrollments ?? 0}
        />

        <AnalyticsCard
          title="Conversion %"
          value={`${conversionRate}%`}
        />

        <AnalyticsCard
          title="Courses"
          value={totalCourses ?? 0}
        />
      </section>

      {/* ================= JOB BREAKDOWN ================= */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">
          Job Performance
        </h2>

        {jobs?.map((job) => (
          <div
            key={job.id}
            className="border rounded-xl p-6 bg-white"
          >
            <p className="font-semibold">{job.title}</p>
            <p className="text-sm text-gray-500">
              Total Views: {job.views ?? 0}
            </p>
          </div>
        ))}
      </section>

      {/* ================= GEO ================= */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Top Countries
        </h2>

        <div className="space-y-3">
          {topCountries.length === 0 && (
            <p className="text-gray-500">
              No geo data yet.
            </p>
          )}

          {topCountries.map(([country, count]) => (
            <div
              key={country}
              className="flex justify-between border p-4 rounded-lg"
            >
              <span>{country}</span>
              <span className="font-semibold">
                {count}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

/* ================= CARD ================= */

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
