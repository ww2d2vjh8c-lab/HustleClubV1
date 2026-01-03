import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, bio")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-xl p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>

      <form action="/actions/profile/update" method="post" className="space-y-4">
        <input
          name="username"
          defaultValue={profile?.username}
          placeholder="Username"
          required
          className="w-full border p-2 rounded"
        />

        <input
          name="full_name"
          defaultValue={profile?.full_name}
          placeholder="Full name"
          className="w-full border p-2 rounded"
        />

        <textarea
          name="bio"
          defaultValue={profile?.bio}
          placeholder="Bio"
          className="w-full border p-2 rounded"
        />

        <button className="bg-black text-white px-4 py-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
}
