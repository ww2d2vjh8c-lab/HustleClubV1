import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ApplicationActions from "@/components/jobs/ApplicationActions";

export const dynamic = "force-dynamic";

/* ───────────────── TYPES ───────────────── */

type ApplicationStatus = "pending" | "accepted" | "rejected";

type Application = {
  id: string;
  created_at: string;
  status: string; // normalize later
  applicant: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
};

/* ──────────────── HELPERS ──────────────── */

function normalizeStatus(status: string): ApplicationStatus {
  if (status === "accepted" || status === "rejected") return status;
  return "pending";
}

/* ───────────────── PAGE ───────────────── */

export default async function ApplicantsPage({
  searchParams,
}: {
  searchParams: { job?: string };
}) {
  const user = await requireUser("/admin/jobs/applicants");
  const supabase = await createSupabaseServerClient();

  const jobId = searchParams.job;

  /* ───────── VALIDATION ───────── */
  if (!jobId) {
    return (
      <div className="max-w-xl mx-auto p-6 text-red-500">
        Missing job id.
      </div>
    );
  }

  /* ───── OWNERSHIP CHECK ───── */
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("id", jobId)
    .eq("created_by", user.id)
    .single();

  if (!job) {
    return (
      <div className="max-w-xl mx-auto p-6 text-red-500">
        You don’t have access to this job.
      </div>
    );
  }

  /* ───── FETCH APPLICATIONS ───── */
  const { data, error } = await supabase
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
        )
      `
    )
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .returns<Application[]>();

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6 text-red-500">
        Failed to load applicants.
      </div>
    );
  }

  /* ───────────────── UI ───────────────── */
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Applicants</h1>
        <p className="text-sm text-gray-600 mt-1">
          Applicants for{" "}
          <span className="font-medium">{job.title}</span>
        </p>
      </header>

      {(!data || data.length === 0) && (
        <p className="text-gray-500">No applications yet.</p>
      )}

      <section className="space-y-4">
        {data?.map((a) => (
          <div
            key={a.id}
            className="border rounded-xl p-5 flex gap-4 bg-white"
          >
            {/* AVATAR */}
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {a.applicant?.avatar_url && (
                <img
                  src={a.applicant.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* INFO */}
            <div className="flex-1 space-y-1">
              <p className="font-medium">
                {a.applicant?.full_name ||
                  a.applicant?.username ||
                  "Anonymous"}
              </p>

              {a.applicant?.bio && (
                <p className="text-sm text-gray-600">
                  {a.applicant.bio}
                </p>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Applied on{" "}
                {new Date(a.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* ACTIONS */}
            <ApplicationActions
              applicationId={a.id}
              status={normalizeStatus(a.status)}
            />
          </div>
        ))}
      </section>
    </main>
  );
}
