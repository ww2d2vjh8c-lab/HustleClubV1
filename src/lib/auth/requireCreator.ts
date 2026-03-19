import { redirect } from "next/navigation";
import { requireCreator as requireSupabaseCreator } from "@/lib/supabase/auth";

export async function requireCreator() {
  const result = await requireSupabaseCreator().catch((error: unknown) => {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login");
    }
    return null;
  });
  if (!result) redirect("/creator/apply");
  return result;
}
