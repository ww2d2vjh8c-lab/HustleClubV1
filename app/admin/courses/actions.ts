"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function setCourseStatus(courseId: string, status: "draft" | "published") {
  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("courses")
    .update({ status })
    .eq("id", courseId);

  if (error) throw new Error("Failed to update course status");

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "admin_course_status_updated",
    target_type: "course",
    target_id: courseId,
    metadata: { status },
  });

  revalidatePath("/admin/courses");
  revalidatePath("/admin/dashboard");
}

export async function deleteCourse(courseId: string) {
  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) throw new Error("Failed to delete course");

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "admin_course_deleted",
    target_type: "course",
    target_id: courseId,
  });

  revalidatePath("/admin/courses");
  revalidatePath("/admin/dashboard");
}
