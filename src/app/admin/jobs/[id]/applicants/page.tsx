import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import ApplicationActions from "@/components/jobs/ApplicationActions";

export const dynamic = "force-dynamic";

type Status = "pending" | "accepted" | "rejected";

type Application = {
  id: string;
  created_at: string;
  status: string;
  profile: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
};

function normalizeStatus(status: string): Status {
  if (status === "accepted" || status === "rejected") return status;
  return "pending";
}

export default async function JobApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!job) {
    redirect("/admin/jobs");
  }

  const { data: applications, error } = await supabase
    .from("job_applications")
    .select(
      `
      id,
      created_at,
      status,
      profile:profiles (
        username,
        full_name,
        avatar_url,
        bio
      )
    `
    )
    .eq("job_id", id)
    .order("created_at", { ascending: false })
    .returns<Application[]>();

  if (error) {
    return (
      <div className="app-card rounded-xl p-6">
        <p className="text-red-600">Failed to load applicants.</p>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold font-[var(--font-display)]">Applicants · {job.title}</h1>
          <Link href={`/admin/jobs/applicants?job=${job.id}`} className="text-sm px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50">
            Open filtered list
          </Link>
        </div>
        <p className="text-sm text-slate-600">Review all applicants for this job and make a final decision.</p>
      </header>

      {applications?.length === 0 ? (
        <p className="text-slate-500">No applications yet.</p>
      ) : null}

      <section className="space-y-4">
        {applications?.map((application) => (
          <div key={application.id} className="app-card rounded-xl p-5 flex gap-4 items-start">
            <div className="relative w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
              {application.profile?.avatar_url ? (
                <Image
                  src={application.profile.avatar_url}
                  alt={application.profile.full_name || application.profile.username || "avatar"}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : null}
            </div>

            <div className="flex-1">
              <p className="font-semibold">
                {application.profile?.full_name || application.profile?.username || "Unnamed"}
              </p>
              <p className="text-sm text-slate-500">@{application.profile?.username || "unknown"}</p>
              {application.profile?.bio ? (
                <p className="text-sm text-slate-700 mt-2">{application.profile.bio}</p>
              ) : null}
              <p className="text-xs text-slate-500 mt-2">
                Applied on {new Date(application.created_at).toLocaleDateString()}
              </p>
            </div>

            <ApplicationActions
              applicationId={application.id}
              status={normalizeStatus(application.status)}
            />
          </div>
        ))}
      </section>
    </main>
  );
}
