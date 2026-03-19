import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ApplicationActions from "@/components/jobs/ApplicationActions";
import Image from "next/image";

export const dynamic = "force-dynamic";

type ApplicationStatus = "pending" | "accepted" | "rejected";

type ApplicationRow = {
  id: string;
  created_at: string;
  status: string;
  applicant: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
  job: {
    id: number;
    title: string;
  }[] | null;
};

function normalizeStatus(status: string): ApplicationStatus {
  if (status === "accepted" || status === "rejected") return status;
  return "pending";
}

export default async function ApplicantsPage({
  searchParams,
}: {
  searchParams?: { job?: string; status?: ApplicationStatus | "all" };
}) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const jobId = searchParams?.job;
  const statusFilter = searchParams?.status ?? "all";

  let query = supabase
    .from("job_applications")
    .select(
      `
        id,
        created_at,
        status,
        applicant:profiles (
          username,
          full_name,
          avatar_url,
          bio
        ),
        job:jobs!inner (
          id,
          title
        )
      `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (jobId) query = query.eq("job_id", jobId);
  if (statusFilter !== "all") query = query.eq("status", statusFilter);

  const { data, error } = await query.returns<ApplicationRow[]>();

  if (error) {
    return (
      <main className="app-card rounded-xl p-6">
        <p className="text-red-600">Failed to load applicants.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">Job Applications</h1>
        <p className="text-sm text-slate-600">Moderate applications across all jobs.</p>
      </header>

      <form method="get" className="app-card rounded-xl p-4 flex flex-wrap gap-2 items-center">
        <input
          name="job"
          defaultValue={jobId}
          placeholder="Filter by job id"
          className="px-3 py-2 min-w-[220px]"
        />
        <select name="status" defaultValue={statusFilter} className="px-3 py-2">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800">
          Apply filters
        </button>
      </form>

      {(!data || data.length === 0) && (
        <p className="text-slate-500">No applications found for this filter.</p>
      )}

      <section className="space-y-4">
        {data?.map((application) => {
          const status = normalizeStatus(application.status);
          const job = application.job?.[0];
          return (
            <div key={application.id} className="app-card rounded-xl p-5 flex gap-4">
              <div className="relative w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                {application.applicant?.avatar_url ? (
                  <Image
                    src={application.applicant.avatar_url}
                    alt={application.applicant.full_name || application.applicant.username || "Applicant avatar"}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="flex-1 space-y-1">
                <p className="font-medium">
                  {application.applicant?.full_name || application.applicant?.username || "Anonymous"}
                </p>
                <p className="text-sm text-slate-600">
                  Job: {job?.title ?? "Unknown"} ({job?.id ?? "—"})
                </p>
                {application.applicant?.bio ? (
                  <p className="text-sm text-slate-600">{application.applicant.bio}</p>
                ) : null}
                <p className="text-xs text-slate-500">
                  Applied on {new Date(application.created_at).toLocaleString()}
                </p>
              </div>

              <ApplicationActions applicationId={application.id} status={status} />
            </div>
          );
        })}
      </section>
    </main>
  );
}
