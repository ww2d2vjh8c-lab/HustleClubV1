import { redirect } from "next/navigation";
import { requireCreator as requireCreatorWithRole } from "@/lib/supabase/auth";

export async function requireCreator() {
  try {
    const { user, supabase } = await requireCreatorWithRole();
    return { user, supabase };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login");
    }
    redirect("/creator/apply");
  }
}
