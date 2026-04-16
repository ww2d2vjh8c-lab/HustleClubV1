"use server";

import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/supabase/auth";

export const IMPERSONATE_COOKIE = "impersonate_user_id";

export async function startImpersonation(targetUserId: string) {
  await requireAdmin();

  const cookieStore = await cookies();

  cookieStore.set(IMPERSONATE_COOKIE, targetUserId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function stopImpersonation() {
  await requireAdmin();

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
}

export async function getImpersonatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(IMPERSONATE_COOKIE)?.value ?? null;
}