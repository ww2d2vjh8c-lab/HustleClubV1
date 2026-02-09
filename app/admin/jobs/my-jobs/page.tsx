import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type JobRow = {
  id: string;
  title: string;
  created_at: string;
  job_applications: { count: number }[];
};

export default async function MyJobsPage() {
const { user } = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      `
        id,
        title,
        created_at,
        job_applications(count)
      `
    )
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .returns<JobRow[]>();

  if (error) {
    console.error("My jobs fetch error:", error);
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load your jobs.
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Jobs</h1>
          <p className="text-sm text-gray-600 mt-1">
            Jobs you’ve posted and their applications
          </p>
        </div>

        <Link
          href="/admin/jobs"
          className="px-5 py-2.5 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition"
        >
          Post Job
        </Link>
      </header>

      {/* EMPTY STATE */}
      {(!jobs || jobs.length === 0) && (
        <p className="text-gray-500">
          You haven’t posted any jobs yet.
        </p>
      )}

      {/* JOB LIST */}
      <section className="space-y-4">
        {jobs?.map((job) => (
          <div
            key={job.id}
            className="border rounded-xl p-5 flex items-center justify-between bg-white"
          >
            <div>
              <h2 className="font-semibold">{job.title}</h2>
              <p className="text-xs text-gray-500 mt-1">
                Posted on{" "}
                {new Date(job.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {job.job_applications?.[0]?.count ?? 0} applicants
              </span>

              <Link
                href="/admin/jobs/applicants"
                className="text-sm font-medium hover:underline"
              >
                View applicants →
              </Link>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
