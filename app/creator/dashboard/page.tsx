import { requireCreator } from "@/lib/supabase/requireCreator";
import Link from "next/link";

export const dynamic = "force-dynamic";

type JobRow = {
  id: number;
  title: string;
  created_at: string;
  is_open: boolean;
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

        {/* QUICK ACTIONS */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/creator/jobs/new"
            className="px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-gray-800 transition"
          >
            Post Job
          </Link>

          <Link
            href="/creator/courses"
            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 transition"
          >
            Manage Courses
          </Link>

          <Link
            href="/creator/marketplace"
            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 transition"
          >
            Manage Marketplace
          </Link>

          <Link
            href="/creator/analytics"
            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 transition"
          >
            Analytics
          </Link>
        </div>
      </header>

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
          {jobs?.map((job) => (
            <div
              key={job.id}
              className="border rounded-xl p-6 bg-white flex justify-between items-center hover:shadow-sm transition"
            >
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

                <p className="text-xs">
                  Applications:{" "}
                  {job.job_applications?.[0]?.count ?? 0}
                </p>
              </div>

              <Link
                href={`/creator/jobs/${job.id}/applications`}
                className="text-sm underline hover:text-gray-600"
              >
                View Applications
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}