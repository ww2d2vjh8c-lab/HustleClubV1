import { requireCreator } from "@/lib/auth/requireCreator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type JobRow = {
  id: number;
  title: string;
  created_at: string;
  applications: { count: number }[];
};

export default async function EmployerJobsPage() {
  // 🔐 Creator-only access (NO ARGUMENTS)
  const { user } = await requireCreator();
  const supabase = await createSupabaseServerClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      created_at,
      applications:job_applications(count)
    `)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .returns<JobRow[]>();

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Failed to load jobs.
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Jobs</h1>
        <Link href="/admin/jobs/new" className="btn-primary">
          Post Job
        </Link>
      </header>

      {jobs?.length === 0 && (
        <p className="text-sm text-gray-500">
          You haven’t posted any jobs yet.
        </p>
      )}

      {jobs?.map((job) => {
        const count = job.applications?.[0]?.count ?? 0;

        return (
          <div key={job.id} className="border p-4 rounded space-y-1">
            <p className="font-medium">{job.title}</p>
            <p className="text-xs text-gray-500">
              {count} applicant{count !== 1 && "s"}
            </p>
          </div>
        );
      })}
    </main>
  );
}