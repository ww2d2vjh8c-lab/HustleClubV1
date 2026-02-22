import { requireCreator } from "@/lib/supabase/requireCreator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

/* ================= PAGE ================= */

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

  /* ✅ SERVER ACTION INSIDE COMPONENT */
  async function toggleJobStatus(formData: FormData) {
    "use server";

    const jobId = Number(formData.get("jobId"));
    const currentStatus = formData.get("currentStatus") === "true";

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("jobs")
      .update({ is_open: !currentStatus })
      .eq("id", jobId);

    if (error) {
      console.log("TOGGLE ERROR:", error);
      throw new Error("Failed to update job");
    }

    redirect("/creator/dashboard");
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Creator Dashboard</h1>
          <p className="text-sm text-gray-600">
            Manage your jobs and applications
          </p>
        </div>

        <Link
          href="/creator/jobs/new"
          className="px-4 py-2 rounded-md bg-black text-white text-sm"
        >
          Post Job
        </Link>
      </header>

      {(!jobs || jobs.length === 0) && (
        <p className="text-gray-500">
          You haven’t posted any jobs yet.
        </p>
      )}

      <section className="space-y-4">
        {jobs?.map((job) => (
          <div
            key={job.id}
            className="border rounded-xl p-5 bg-white shadow-sm flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold">{job.title}</h2>

              <p className="text-sm text-gray-500">
                Posted on{" "}
                {new Date(job.created_at).toLocaleDateString()}
              </p>

              <p className="text-xs mt-1">
                Status:{" "}
                <span
                  className={
                    job.is_open
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {job.is_open ? "Open" : "Closed"}
                </span>
              </p>

              <p className="text-xs mt-1">
                Applications:{" "}
                {job.job_applications?.[0]?.count ?? 0}
              </p>
            </div>

            <div className="flex gap-4 items-center">
              <Link
                href={`/creator/jobs/${job.id}/applications`}
                className="text-sm underline"
              >
                View
              </Link>

              {/* ✅ Proper server action form */}
              <form action={toggleJobStatus}>
                <input
                  type="hidden"
                  name="jobId"
                  value={job.id}
                />
                <input
                  type="hidden"
                  name="currentStatus"
                  value={String(job.is_open)}
                />
                <button
                  type="submit"
                  className={`text-sm px-3 py-1 rounded ${
                    job.is_open
                      ? "bg-red-600 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  {job.is_open ? "Close" : "Reopen"}
                </button>
              </form>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}