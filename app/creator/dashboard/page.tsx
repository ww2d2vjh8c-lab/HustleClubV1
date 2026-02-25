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
    <main className="max-w-6xl mx-auto p-6 space-y-10">
      {/* HEADER */}
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">
            Creator Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Manage your platform content
          </p>
        </div>

        {/* QUICK ACTIONS */}
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
        </div>
      </header>

      {/* JOB SECTION */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Your Jobs
        </h2>

        {(!jobs || jobs.length === 0) && (
          <p className="text-gray-500">
            You haven’t posted any jobs yet.
          </p>
        )}

        {jobs?.map((job) => (
          <div
            key={job.id}
            className="border rounded-xl p-5 bg-white flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold">{job.title}</h3>

              <p className="text-sm text-gray-500">
                Posted on{" "}
                {new Date(job.created_at).toLocaleDateString()}
              </p>

              <p className="text-xs mt-1">
                Status: {job.is_open ? "Open" : "Closed"}
              </p>

              <p className="text-xs mt-1">
                Applications: {job.job_applications?.[0]?.count ?? 0}
              </p>
            </div>

            <Link
              href={`/creator/jobs/${job.id}/applications`}
              className="text-sm underline"
            >
              View
            </Link>
          </div>
        ))}
      </section>
    </main>
  );
}