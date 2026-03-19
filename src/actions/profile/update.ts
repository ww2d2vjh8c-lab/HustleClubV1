"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  normalizeUsername,
  validateUsername,
  validateFullName,
  validateBio,
} from "@/lib/profile/validation";

export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const rawUsername = (formData.get("username") as string) ?? "";
  const rawFullName = (formData.get("full_name") as string) ?? "";
  const rawBio = (formData.get("bio") as string) ?? "";

  const username = normalizeUsername(rawUsername);
  const fullName = rawFullName.trim();
  const bio = rawBio.trim();

  if (!username) {
    return { error: "Username is required" };
  }

  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError };

  const fullNameError = validateFullName(fullName);
  if (fullNameError) return { error: fullNameError };

  const bioError = validateBio(bio);
  if (bioError) return { error: bioError };

  await supabase
    .from("profiles")
    .update({
      username,
      full_name: fullName,
      bio,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  redirect(`/u/${username}`);
}
