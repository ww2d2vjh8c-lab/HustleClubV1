"use server";

import { requireAdmin } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateUserRole(
  userId: string,
  role: "user" | "creator" | "admin"
) {
  const { user: adminUser } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  if (adminUser.id === userId && role !== "admin") {
    throw new Error("You cannot remove your own admin access.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    throw new Error("Failed to update role");
  }

  await supabase.from("audit_logs").insert({
    actor_id: adminUser.id,
    action: "admin_update_user_role",
    target_type: "profile",
    target_id: userId,
    metadata: { role },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/analytics");
}
