import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile/isProfileComplete";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import ApplyButton from "@/components/jobs/ApplyButton";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type JobWithCreator = {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  is_open: boolean;
  views: number | null;
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

        {job.description && (
          <p className="mt-4 text-gray-700 whitespace-pre-line">
            {job.description}
          </p>
        )}
      </div>

      <div className="pt-4 space-y-3">
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