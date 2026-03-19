import { redirect } from "next/navigation";
import { requireUser as requireSupabaseUser } from "@/lib/supabase/auth";

export async function requireUser() {
  const result = await requireSupabaseUser().catch(() => null);
  if (!result) redirect("/login");
  return result;
}
