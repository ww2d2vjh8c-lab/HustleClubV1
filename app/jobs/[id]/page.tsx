import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile/isProfileComplete";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import ApplyButton from "@/components/jobs/ApplyButton";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profileComplete = user
    ? await isProfileComplete(user.id)
    : false;

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
    .single();

  if (error || !job) {
    return (
      <div className="max-w-xl mx-auto p-6 text-red-500">
        Job not found.
      </div>
    );
  }

  const creator = job.profile?.[0] ?? null;

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

      <div className="pt-4">
        {!job.is_open && (
          <span className="text-sm text-gray-400">
            Applications closed
          </span>
        )}

        {job.is_open && user && profileComplete && (
          <ApplyButton jobId={job.id} />
        )}

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
    </main>
  );
}