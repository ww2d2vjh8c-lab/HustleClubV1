import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile/isProfileComplete";

export async function requireCompleteProfile(
  next?: string,
  allowProfilePage = false
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }

  const complete = await isProfileComplete(user.id);

  if (!complete && !allowProfilePage) {
    redirect("/profile");
  }

  return user;
}

