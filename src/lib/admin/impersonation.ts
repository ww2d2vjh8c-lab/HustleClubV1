"use server";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const IMPERSONATE_COOKIE = "impersonate_user_id";

// Standalone admin check — does NOT import from auth.ts to avoid circular dependency
// (auth.ts imports getImpersonatedUserId from this file)
async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Admin access required");
}

export async function startImpersonation(targetUserId: string) {
  await assertAdmin();
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, targetUserId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function stopImpersonation() {
  await assertAdmin();
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
}

export async function getImpersonatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(IMPERSONATE_COOKIE)?.value ?? null;
}
