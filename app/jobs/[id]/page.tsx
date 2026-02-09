import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile/isProfileComplete";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import ApplyButton from "@/components/jobs/ApplyButton";

export const dynamic = "force-dynamic";

type JobWithCreator = {
  id: number;
  title: string;
  description: string;
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

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createSupabaseServerClient();

  /* ───────────── AUTH ───────────── */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profileComplete = user
    ? await isProfileComplete(user.id)
    : false;

  /* ───────────── JOB ───────────── */
  const { data: job, error } = await supabase
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
    .eq("id", params.id)
    .single<JobWithCreator>();

  if (error || !job) {
    return (
      <div className="max-w-xl mx-auto p-6 text-red-500">
        Job not found.
      </div>
    );
  }

  const creator = job.profile[0] ?? null;

  /* ───────────── UI ───────────── */
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      {creator && (
        <ProfileHoverCard
          username={creator.username ?? "anonymous"}
          fullName={creator.full_name}
          avatarUrl={creator.avatar_url}
          bio={creator.bio}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Posted on {new Date(job.created_at).toLocaleDateString()}
        </p>

        <p className="mt-4 text-gray-700 whitespace-pre-line">
          {job.description}
        </p>
      </div>

      {/* ACTION */}
      <div className="pt-4">
        {!job.is_open && (
          <span className="text-sm font-medium text-gray-400">
            Applications closed
          </span>
        )}

        {job.is_open && !user && (
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Login to apply
          </Link>
        )}

        {job.is_open && user && !profileComplete && (
          <Link
            href="/profile"
            className="px-5 py-2.5 rounded-lg border border-yellow-400 text-yellow-700 hover:bg-yellow-50"
          >
            Complete profile to apply
          </Link>
        )}

        {job.is_open && user && profileComplete && (
          <ApplyButton jobId={job.id} />
        )}
      </div>
    </main>
  );
}
