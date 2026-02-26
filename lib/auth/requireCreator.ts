import { redirect } from "next/navigation";
import { requireCreator as requireSupabaseCreator } from "@/lib/supabase/auth";

export async function requireCreator() {
  try {
    const { user, supabase } = await requireSupabaseCreator();
    return { user, supabase };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login");
    }

    redirect("/become-creator");
  }
}
