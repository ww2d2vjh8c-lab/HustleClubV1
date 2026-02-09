import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/requireUser";
import Image from "next/image";

export const dynamic = "force-dynamic";

type Application = {
  created_at: string;
  profile: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
};

export default async function JobApplicantsPage({
  params,
}: {
  params: { id: string };
}) {
const { user } = await requireUser();
  const supabase = await createSupabaseServerClient();

  /* 1️⃣ Verify job ownership */
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", params.id)
    .eq("created_by", user.id)
    .single();

  if (!job) {
    redirect("/admin/jobs");
  }

  /* 2️⃣ Fetch applicants */
  const { data: applications, error } = await supabase
    .from("job_applications")
    .select(
      `
      created_at,
      profile:profiles (
        username,
        full_name,
        avatar_url,
        bio
      )
    `
    )
    .eq("job_id", params.id)
    .order("created_at", { ascending: false })
    .returns<Application[]>();

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6 text-red-500">
        Failed to load applicants
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Applicants</h1>

      {applications?.length === 0 && (
        <p className="text-gray-500">No applications yet.</p>
      )}

      {applications?.map((a, i) => (
        <div
          key={i}
          className="border rounded-xl p-4 flex gap-4 items-start bg-white"
        >
          <Image
            src={a.profile.avatar_url || "/avatar-placeholder.png"}
            alt="avatar"
            width={48}
            height={48}
            className="rounded-full"
          />

          <div className="flex-1">
            <p className="font-semibold">
              {a.profile.full_name || "Unnamed"}
            </p>
            <p className="text-sm text-gray-500">
              @{a.profile.username}
            </p>

            {a.profile.bio && (
              <p className="text-sm text-gray-700 mt-2">
                {a.profile.bio}
              </p>
            )}

            <p className="text-xs text-gray-400 mt-2">
              Applied on{" "}
              {new Date(a.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </main>
  );
}
