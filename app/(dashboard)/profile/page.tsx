import AvatarUploader from "@/components/profile/AvatarUploader";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Your Profile</h1>

      <div>
        <h2 className="font-semibold mb-2">Avatar</h2>
        <AvatarUploader userId={user.id} />
      </div>
    </div>
  );
}
