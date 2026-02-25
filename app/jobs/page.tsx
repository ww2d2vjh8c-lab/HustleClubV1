import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile/isProfileComplete";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import ApplyButton from "@/components/jobs/ApplyButton";

export const dynamic = "force-dynamic";

type JobRow = {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  is_open: boolean;
  creator_id: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export default async function JobsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profileComplete = user
    ? await isProfileComplete(user.id)
    : false;

  /* ================= FETCH JOBS ================= */

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      description,
      created_at,
      is_open,
      creator_id
    `)
    .eq("is_open", true)
    .order("created_at", { ascending: false })
    .returns<JobRow[]>();

  if (error) {
    console.log("JOBS LOAD ERROR:", error);
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load jobs.
      </div>
    );
  }

  /* ================= FETCH PROFILES ================= */

  const creatorIds = jobs?.map((job) => job.creator_id) ?? [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      bio
    `)
    .in("id", creatorIds)
    .returns<ProfileRow[]>();

  const profileMap =
    profiles?.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, ProfileRow>) ?? {};

  /* ================= RENDER ================= */

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Jobs</h1>

        {user && profileComplete && (
          <Link
            href="/creator/jobs/new"
            className="px-5 py-2.5 rounded-lg bg-black text-white"
          >
            Post Job
          </Link>
        )}
      </header>

      <section className="space-y-6">
        {jobs?.map((job) => {
          const creator = profileMap[job.creator_id] ?? null;

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

              <h2 className="text-lg font-semibold">
                {job.title}
              </h2>

              {job.description && (
                <p className="text-sm text-gray-600">
                  {job.description}
                </p>
              )}

              {job.is_open ? (
                user && profileComplete ? (
                  <ApplyButton jobId={job.id} />
                ) : user ? (
                  <Link
                    href="/profile"
                    className="text-sm text-yellow-600"
                  >
                    Complete profile to apply
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="text-sm text-blue-600"
                  >
                    Login to apply
                  </Link>
                )
              ) : (
                <span className="text-sm text-gray-400">
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