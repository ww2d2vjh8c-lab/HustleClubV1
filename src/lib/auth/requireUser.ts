import { redirect } from "next/navigation";
import { requireUser as requireSupabaseUser } from "@/lib/supabase/auth";

export async function requireUser() {
  try {
    const { user, supabase } = await requireSupabaseUser();
    return { user, supabase };
  } catch {
    redirect("/login");
  }
}
