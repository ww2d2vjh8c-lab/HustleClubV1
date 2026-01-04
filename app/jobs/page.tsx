import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";

export const dynamic = "force-dynamic";

type JobWithProfile = {
  id: string;
  title: string;
  description: string;
  profile: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
    bio: string | null;
  };
};

export default async function JobsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      description,
      profile:profiles!inner (
        username,
        avatar_url,
        full_name,
        bio
      )
    `)
    .returns<JobWithProfile[]>();

  if (error) {
    return <div className="p-6 text-red-500">Failed to load jobs</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Jobs</h1>

      {jobs?.map((job) => (
        <div
          key={job.id}
          className="border rounded-lg p-4 space-y-2"
        >
          <ProfileHoverCard
            username={job.profile.username}
            fullName={job.profile.full_name}
            avatarUrl={job.profile.avatar_url}
            bio={job.profile.bio}
          />

          <h2 className="font-semibold">{job.title}</h2>
          <p className="text-sm text-gray-600">{job.description}</p>
        </div>
      ))}
    </div>
  );
}
