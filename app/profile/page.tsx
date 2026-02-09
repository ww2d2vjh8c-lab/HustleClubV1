import AvatarUploader from "@/components/profile/AvatarUploader";
import ProfileForm from "@/components/profile/ProfileForm";
import ProfileCompletion from "@/components/profile/ProfileCompletion";
import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const supabase = await createSupabaseServerClient();

  /* ───────────── PROFILE ───────────── */
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, bio, avatar_url, role")
    .eq("id", user.id)
    .single();

  // Create profile once (safe)
  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      role: "user",
    });

    redirect("/profile");
  }

  /* ───────── CREATOR REQUEST ───────── */
  const { data: creatorRequest } = await supabase
    .from("creator_requests")
    .select("id, status, reason")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  /* ───────────── UI ───────────── */
  return (
    <main className="max-w-xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <p className="text-sm text-gray-600 mt-1">
          Complete your profile to unlock jobs, marketplace & courses.
        </p>
      </header>

      {/* PROFILE COMPLETION */}
      <ProfileCompletion
        avatarUrl={profile.avatar_url}
        username={profile.username}
        fullName={profile.full_name}
        bio={profile.bio}
      />

      {/* CREATOR STATUS */}
      <section className="border rounded-xl p-4 space-y-2 bg-gray-50">
        <h2 className="font-semibold">Creator Status</h2>

        {/* ALREADY CREATOR */}
        {profile.role === "creator" && (
          <p className="text-sm text-green-600 font-medium">
            ✅ You are a creator
          </p>
        )}

        {/* PENDING */}
        {creatorRequest?.status === "pending" && (
          <p className="text-sm text-yellow-600">
            ⏳ Your creator request is under review
          </p>
        )}

        {/* REJECTED */}
        {creatorRequest?.status === "rejected" && (
          <div className="space-y-1">
            <p className="text-sm text-red-600 font-medium">
              ❌ Creator request rejected
            </p>

            {creatorRequest.reason && (
              <p className="text-sm text-red-500">
                Reason: {creatorRequest.reason}
              </p>
            )}

            <Link
              href="/creator/apply"
              className="inline-block text-sm text-blue-600 mt-2"
            >
              Apply again
            </Link>
          </div>
        )}

        {/* NO REQUEST */}
        {!creatorRequest && profile.role !== "creator" && (
          <Link
            href="/creator/apply"
            className="inline-block text-sm text-blue-600"
          >
            Apply to become a creator
          </Link>
        )}
      </section>

      {/* AVATAR */}
      <section>
        <h2 className="font-semibold mb-2">Avatar</h2>
        <AvatarUploader userId={user.id} />
      </section>

      {/* PROFILE FORM */}
      <ProfileForm
        userId={user.id}
        initialUsername={profile.username}
        initialFullName={profile.full_name}
        initialBio={profile.bio}
      />
    </main>
  );
}
