import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile/isProfileComplete";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import ApplyButton from "@/components/jobs/ApplyButton";
import { parseJobDescription } from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

type JobRow = {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  is_open: boolean;
  creator_id: string;
  budget: number | null;
  type: string | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type JobsPageProps = {
  searchParams?: {
    q?: string;
    type?: string;
  };
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profileComplete = user
    ? await isProfileComplete(user.id)
    : false;
  const q = searchParams?.q?.trim() ?? "";
  const type = searchParams?.type ?? "all";

  /* ================= FETCH JOBS ================= */

  let jobsQuery = supabase
    .from("jobs")
    .select(`
      id,
      title,
      description,
      created_at,
      is_open,
      creator_id,
      budget,
      type
    `)
    .eq("is_open", true);

  if (q) {
    const safeQ = q.replace(/[%,"']/g, " ").trim();
    if (safeQ) {
      jobsQuery = jobsQuery.or(
        `title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`
      );
    }
  }

  if (type !== "all") {
    jobsQuery = jobsQuery.eq("type", type);
  }

  const { data: jobs, error } = await jobsQuery
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
      <header className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Jobs</h1>

          {user && profileComplete && (
            <Link
              href="/creator/jobs/new"
              className="px-5 py-2.5 rounded-lg bg-black text-white"
            >
              Post Job
            </Link>
          )}
        </div>

        <form className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search jobs by title or requirement..."
            className="w-full border rounded-lg px-3 py-2"
          />
          <select name="type" defaultValue={type} className="w-full border rounded-lg px-3 py-2">
            <option value="all">All Types</option>
            <option value="ugc">UGC</option>
            <option value="clipping">Clipping</option>
            <option value="editing">Editing</option>
            <option value="other">Other</option>
          </select>
          <button className="rounded-lg bg-black text-white px-4 py-2">Search</button>
        </form>
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

              <p className="text-sm text-gray-600">
                {parseJobDescription(job.description).overview || "New opportunity posted by a creator."}
              </p>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-gray-100 capitalize">
                  {job.type ?? "other"}
                </span>
                <span className="px-2 py-1 rounded-full bg-gray-100">
                  Budget: ₹{job.budget ?? 0}
                </span>
              </div>

              <Link href={`/jobs/${job.id}`} className="text-sm underline">
                View full details
              </Link>

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
