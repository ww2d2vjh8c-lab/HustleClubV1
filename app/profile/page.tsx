// app/profile/page.tsx
import AvatarUploader from "@/components/profile/AvatarUploader";
import ProfileForm from "@/components/profile/ProfileForm";
import ProfileCompletion from "@/components/profile/ProfileCompletion";
import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user } = await requireUser();
  const supabase = await createSupabaseServerClient();
  const metadataFullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";

  let { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, bio, avatar_url, role, email")
    .eq("id", user.id)
    .maybeSingle();

  // Bootstrap profile if trigger did not insert yet.
  if (!profile) {
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      role: "user",
      email: user.email ?? null,
      full_name: metadataFullName || null,
    });

    if (error && error.code !== "23505") {
      console.error("Profile creation failed", error);
      throw new Error("Unable to initialize profile");
    }

    const { data: newProfile } = await supabase
      .from("profiles")
      .select("username, full_name, bio, avatar_url, role, email")
      .eq("id", user.id)
      .single();

    profile = newProfile!;
  } else if (!profile.full_name && metadataFullName) {
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .update({ full_name: metadataFullName })
      .eq("id", user.id)
      .select("username, full_name, bio, avatar_url, role, email")
      .single();

    profile = updatedProfile ?? profile;
  }

  const { data: creatorRequest } = await supabase
    .from("creator_requests")
    .select("id, status, reason")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="app-container max-w-3xl py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">Your Profile</h1>
        <p className="text-sm text-slate-600 mt-1">
          Complete your profile to unlock jobs, marketplace & courses.
        </p>
      </header>

      <ProfileCompletion
        avatarUrl={profile.avatar_url}
        username={profile.username}
        fullName={profile.full_name}
        bio={profile.bio}
      />

      <section className="app-card rounded-xl p-5 space-y-2">
        <h2 className="font-semibold">Creator Status</h2>

        {profile.role === "creator" && (
          <p className="text-sm text-green-600 font-medium">
            ✅ You are a creator
          </p>
        )}

        {creatorRequest?.status === "pending" && (
          <p className="text-sm text-yellow-600">
            ⏳ Your creator request is under review
          </p>
        )}

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

            <Link href="/creator/apply" className="text-sm text-sky-700 underline">
              Apply again
            </Link>
          </div>
        )}

        {!creatorRequest && profile.role !== "creator" && (
          <Link href="/creator/apply" className="text-sm text-sky-700 underline">
            Apply to become a creator
          </Link>
        )}
      </section>

      <section className="app-card rounded-xl p-5">
        <h2 className="font-semibold mb-2">Avatar</h2>
        <AvatarUploader userId={user.id} />
      </section>

      <ProfileForm
        userId={user.id}
        email={profile.email ?? user.email ?? ""}
        initialUsername={profile.username}
        initialFullName={profile.full_name}
        initialBio={profile.bio}
      />
    </main>
  );
}
