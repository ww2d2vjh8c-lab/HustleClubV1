import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { toggleJobStatus, deleteJob } from "./actions";

export const dynamic = "force-dynamic";

type JobRow = {
  id: number;
  title: string;
  is_open: boolean;
  created_at: string;
  creator_id: string | null;
  applications: { count: number }[];
};

export default async function AdminJobsPage() {
  const { supabase } = await requireAdmin();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      is_open,
      created_at,
      creator_id,
      applications:job_applications(count)
    `)
    .order("created_at", { ascending: false })
    .returns<JobRow[]>();

  if (error) {
    return (
      <main className="app-card rounded-xl p-6">
        <p className="text-red-600">Failed to load jobs.</p>
      </main>
    );
  }

  const creatorIds = [...new Set((jobs ?? []).map((job) => job.creator_id).filter(Boolean))] as string[];
  const { data: creators } = creatorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, email")
        .in("id", creatorIds)
    : { data: [] as { id: string; username: string | null; full_name: string | null; email: string | null }[] };

  const creatorById = new Map((creators ?? []).map((creator) => [creator.id, creator]));

  const openJobs = jobs?.filter((job) => job.is_open).length ?? 0;
  const totalApplications = jobs?.reduce((sum, job) => sum + (job.applications?.[0]?.count ?? 0), 0) ?? 0;

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap justify-between items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold font-[var(--font-display)]">Jobs Moderation</h1>
          <p className="text-sm text-slate-600">Review, close, reopen, and remove job posts platform-wide.</p>
        </div>

        <Link
          href="/admin/jobs/new"
          className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
        >
          Post New Job
        </Link>
      </header>

      <section className="app-card rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Metric label="Total Jobs" value={jobs?.length ?? 0} />
        <Metric label="Open Jobs" value={openJobs} />
        <Metric label="Closed Jobs" value={(jobs?.length ?? 0) - openJobs} />
        <Metric label="Applications" value={totalApplications} />
      </section>

      <section className="space-y-3">
        {jobs?.map((job) => {
          const creator = job.creator_id ? creatorById.get(job.creator_id) : null;
          return (
            <article key={job.id} className="app-card rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="font-semibold text-lg">{job.title}</h2>
                  <p className="text-sm text-slate-600">
                    By {creator?.full_name || creator?.username || creator?.email || "Unknown creator"} ·{" "}
                    {new Date(job.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-slate-500">
                    {job.applications?.[0]?.count ?? 0} applications · Status:{" "}
                    <span className={job.is_open ? "text-emerald-700" : "text-slate-600"}>
                      {job.is_open ? "Open" : "Closed"}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/jobs/applicants?job=${job.id}`}
                    className="px-3 py-1.5 rounded-full border border-slate-200 text-sm hover:bg-slate-50"
                  >
                    Applicants
                  </Link>

                  <form
                    action={async () => {
                      "use server";
                      await toggleJobStatus(String(job.id));
                    }}
                  >
                    <button className="px-3 py-1.5 rounded-full border border-slate-200 text-sm hover:bg-slate-50">
                      {job.is_open ? "Close Job" : "Reopen Job"}
                    </button>
                  </form>

                  <form
                    action={async () => {
                      "use server";
                      await deleteJob(String(job.id));
                    }}
                  >
                    <button className="px-3 py-1.5 rounded-full border border-rose-200 text-rose-700 text-sm hover:bg-rose-50">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </article>
          );
        })}

        {jobs?.length === 0 ? (
          <div className="app-card rounded-xl p-6 text-slate-500">No jobs found.</div>
        ) : null}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
