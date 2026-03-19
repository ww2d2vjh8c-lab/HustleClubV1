"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({
      username: formData.get("username"),
      full_name: formData.get("full_name"),
      bio: formData.get("bio"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  redirect(`/u/${formData.get("username")}`);
}
