import { requireCreator } from "@/lib/auth/requireCreator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import JobCard from "@/components/dashboard/JobCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireCreator("/admin/dashboard");
  const supabase = await createSupabaseServerClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id,title,created_at,job_applications(count)")
    .eq("created_by", user.id);

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/admin/jobs">Post Job</Link>
      </header>

      {jobs?.map((job) => (
        <JobCard
          key={job.id}
          id={job.id}
          title={job.title}
          createdAt={job.created_at}
          applicationsCount={job.job_applications?.[0]?.count ?? 0}
        />
      ))}
    </main>
  );
}
