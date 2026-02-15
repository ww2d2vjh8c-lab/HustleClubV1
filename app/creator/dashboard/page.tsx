import { requireCreator } from "@/lib/supabase/requireCreator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import JobCard from "@/components/dashboard/JobCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CreatorDashboardPage() {
  const { user, supabase } = await requireCreator();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, created_at, job_applications(count)")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      {/* HEADER */}
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

      {/* JOB LIST */}
      {(!jobs || jobs.length === 0) && (
        <p className="text-gray-500">
          You haven’t posted any jobs yet.
        </p>
      )}

      <section className="space-y-4">
        {jobs?.map((job) => (
          <JobCard
            key={job.id}
            id={job.id}
            title={job.title}
            createdAt={job.created_at}
            applicationsCount={
              job.job_applications?.[0]?.count ?? 0
            }
          />
        ))}
      </section>
    </main>
  );
}