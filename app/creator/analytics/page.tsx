import { requireCreator } from "@/lib/supabase/requireCreator";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CreatorAnalyticsPage() {
  const { user } = await requireCreator();
  const supabase = await createSupabaseServerClient();

  /* ================= COURSES ================= */

  const { count: totalCourses } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", user.id);

  const { count: totalEnrollments } = await supabase
    .from("course_enrollments")
    .select(`
      id,
      course:courses!inner(creator_id)
    `, { count: "exact", head: true })
    .eq("course.creator_id", user.id);

  /* ================= JOBS ================= */

  const { count: totalJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", user.id);

  const { count: totalApplications } = await supabase
    .from("job_applications")
    .select(`
      id,
      job:jobs!inner(creator_id)
    `, { count: "exact", head: true })
    .eq("job.creator_id", user.id);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-10">
      <header>
        <h1 className="text-3xl font-bold">
          Creator Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          Overview of your platform performance
        </p>
      </header>

      <section className="grid md:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Courses"
          value={totalCourses ?? 0}
        />

        <AnalyticsCard
          title="Total Enrollments"
          value={totalEnrollments ?? 0}
        />

        <AnalyticsCard
          title="Jobs Posted"
          value={totalJobs ?? 0}
        />

        <AnalyticsCard
          title="Job Applications"
          value={totalApplications ?? 0}
        />
      </section>
    </main>
  );
}

/* ================= COMPONENT ================= */

function AnalyticsCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="border rounded-xl p-6 bg-white shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}