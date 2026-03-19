import { redirect } from "next/navigation";
import { requireAdmin as requireSupabaseAdmin } from "@/lib/supabase/auth";

export async function requireAdmin() {
  const result = await requireSupabaseAdmin().catch((error: unknown) => {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login");
    }
    return null;
  });
  if (!result) redirect("/");
  return result;
}
