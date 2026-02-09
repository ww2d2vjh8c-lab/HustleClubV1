"use server";

import { requireAdmin } from "@/lib/supabase/auth";

export async function updateUserRole(
  userId: string,
  role: "user" | "creator" | "admin"
) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    throw new Error("Failed to update role");
  }
}
