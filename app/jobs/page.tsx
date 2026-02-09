import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile/isProfileComplete";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import ApplyButton from "@/components/jobs/ApplyButton";

export const dynamic = "force-dynamic";

type JobRow = {
  id: string; // bigint → string
  title: string;
  description: string | null;
  created_at: string;
  is_open: boolean;
  profile: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  }[];
};

export default async function JobsPage() {
  const supabase = await createSupabaseServerClient();

  /* ───────────── AUTH ───────────── */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profileComplete = user
    ? await isProfileComplete(user.id)
    : false;

  /* ───────────── JOBS ───────────── */
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      `
        id,
        title,
        description,
        created_at,
        is_open,
        profile:profiles!jobs_creator_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          bio
        )
      `
    )
    .order("created_at", { ascending: false })
    .returns<JobRow[]>();

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load jobs.
      </div>
    );
  }

  /* ───────────── UI ───────────── */
  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Jobs</h1>

        {user && profileComplete && (
          <Link
            href="/admin/jobs"
            className="px-5 py-2.5 rounded-lg bg-black text-white"
          >
            Post Job
          </Link>
        )}
      </header>

      <section className="space-y-6">
        {jobs?.map((job) => {
          const creator = job.profile[0] ?? null;
          const numericJobId = Number(job.id);

          return (
            <article
              key={job.id}
              className="border rounded-xl p-6 bg-white space-y-4"
            >
              {creator && (
                <ProfileHoverCard
                  username={creator.username ?? "anonymous"}
                  fullName={creator.full_name}
                  avatarUrl={creator.avatar_url}
                  bio={creator.bio}
                />
              )}

              <h2 className="text-lg font-semibold">{job.title}</h2>

              {job.description && (
                <p className="text-sm text-gray-600">
                  {job.description}
                </p>
              )}

              {/* ACTION */}
              {job.is_open ? (
                user && profileComplete ? (
                  <ApplyButton jobId={numericJobId} />
                ) : null
              ) : (
                <span className="text-sm font-medium text-gray-400">
                  Applications closed
                </span>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
