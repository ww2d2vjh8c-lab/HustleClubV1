import { redirect } from "next/navigation";
import { requireAdmin as requireSupabaseAdmin } from "@/lib/supabase/auth";

export async function requireAdmin() {
  try {
    const { user, supabase } = await requireSupabaseAdmin();
    return { user, supabase };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login");
    }

    redirect("/");
  }
}
