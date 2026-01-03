import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, bio, avatar_url, role, is_verified")
    .eq("username", params.username)
    .single();

  if (!profile) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200" />
        <div>
          <h1 className="text-xl font-bold">
            {profile.full_name || profile.username}
            {profile.is_verified && (
              <span className="ml-2 text-blue-600">✔</span>
            )}
          </h1>
          <p className="text-gray-500">@{profile.username}</p>
        </div>
      </div>

      {profile.bio && (
        <p className="mt-4 text-gray-700">{profile.bio}</p>
      )}
    </div>
  );
}
