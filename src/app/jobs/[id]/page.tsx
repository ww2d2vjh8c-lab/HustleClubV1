import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile/isProfileComplete";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import ApplyButton from "@/components/jobs/ApplyButton";
import { headers } from "next/headers";
import { parseJobDescription } from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

type JobWithCreator = {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  is_open: boolean;
  views: number | null;
  budget: number | null;
  type: string | null;
  creator_id: string;
  profile: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  }[] | null;
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profileComplete = user
    ? await isProfileComplete(user.id)
    : false;

  const { data: job, error } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      description,
      created_at,
      is_open,
      views,
      budget,
      type,
      creator_id,
      profile:profiles!jobs_creator_id_fkey (
        id,
        username,
        full_name,
        avatar_url,
        bio
      )
    `)
    .eq("id", Number(id))
    .single<JobWithCreator>();

  if (error || !job) {
    return (
      <div className="max-w-xl mx-auto p-6 text-red-500">
        Job not found.
      </div>
    );
  }

  /* ================= UNIQUE VIEW SYSTEM ================= */

  const isCreatorViewing = user?.id === job.creator_id;

  if (!isCreatorViewing) {

    // 🔹 CASE 1: Logged-in user (lifetime unique)
    if (user) {
      const { data: existingView } = await supabase
        .from("job_views")
        .select("id")
        .eq("job_id", job.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingView) {
        await supabase.from("job_views").insert({
          job_id: job.id,
          user_id: user.id,
        });

        await supabase
          .from("jobs")
          .update({
            views: job.views ? job.views + 1 : 1,
          })
          .eq("id", job.id);
      }
    }

    // 🔹 CASE 2: Anonymous user (IP-based)
    else {
      const headersList = await headers();
      const forwarded = headersList.get("x-forwarded-for");
      const ip =
        forwarded?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip") ||
        "unknown";

      const { data: existingIpView } = await supabase
        .from("job_ip_views")
        .select("id")
        .eq("job_id", job.id)
        .eq("ip_address", ip)
        .maybeSingle();

      if (!existingIpView) {
        await supabase.from("job_ip_views").insert({
          job_id: job.id,
          ip_address: ip,
        });

        await supabase
          .from("jobs")
          .update({
            views: job.views ? job.views + 1 : 1,
          })
          .eq("id", job.id);
      }
    }
  }

  /* ======================================================= */

  const creator = job.profile?.[0] ?? null;
  const parsed = parseJobDescription(job.description);
  const { count: applicationCount } = await supabase
    .from("job_applications")
    .select("id", { head: true, count: "exact" })
    .eq("job_id", job.id);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <section className="space-y-6">
          {creator && (
            <ProfileHoverCard
              username={creator.username ?? "anonymous"}
              fullName={creator.full_name}
              avatarUrl={creator.avatar_url}
              bio={creator.bio}
            />
          )}

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-sm text-gray-500">
              Posted on {new Date(job.created_at).toLocaleDateString()}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-gray-100 capitalize">
                {job.type ?? "other"}
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-100">
                Budget: ₹{job.budget ?? 0}
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-100">
                {applicationCount ?? 0} applications
              </span>
            </div>
          </div>

          <p className="text-gray-700">{parsed.overview || "Open role with clear deliverables."}</p>

          <JobListSection title="Responsibilities" items={parsed.responsibilities} />
          <JobListSection title="Requirements" items={parsed.requirements} />
          <JobListSection title="Deliverables" items={parsed.deliverables} />

          {(parsed.timeline || parsed.idealCandidate) && (
            <section className="grid md:grid-cols-2 gap-4">
              {parsed.timeline && (
                <div className="rounded-lg border p-4 bg-white">
                  <p className="text-xs text-gray-500 uppercase">Timeline</p>
                  <p className="mt-2 text-sm text-gray-700">{parsed.timeline}</p>
                </div>
              )}
              {parsed.idealCandidate && (
                <div className="rounded-lg border p-4 bg-white">
                  <p className="text-xs text-gray-500 uppercase">Ideal Candidate</p>
                  <p className="mt-2 text-sm text-gray-700">{parsed.idealCandidate}</p>
                </div>
              )}
            </section>
          )}
        </section>

        <aside className="rounded-xl border bg-white p-5 space-y-4 lg:sticky lg:top-24">
          <p className="text-xs uppercase tracking-wide text-gray-500">Application</p>
          <p className="text-2xl font-bold">₹{job.budget ?? 0}</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>{job.views ?? 0} views</li>
            <li>{applicationCount ?? 0} total applications</li>
            <li>Status: {job.is_open ? "Open" : "Closed"}</li>
          </ul>

          <div className="pt-2 space-y-3">
            {!job.is_open && (
              <span className="text-sm text-gray-400">Applications closed</span>
            )}

            {job.is_open && user && profileComplete && <ApplyButton jobId={job.id} />}

            {job.is_open && user && !profileComplete && (
              <Link href="/profile" className="text-yellow-600">
                Complete profile to apply
              </Link>
            )}

            {job.is_open && !user && (
              <Link href="/login" className="text-blue-600">
                Login to apply
              </Link>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function JobListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="space-y-2 text-gray-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="rounded-lg border p-3 bg-white">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
