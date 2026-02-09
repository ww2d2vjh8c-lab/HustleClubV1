"use server";

import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/supabase/auth";

const IMPERSONATE_COOKIE = "impersonate_user_id";

export async function startImpersonation(targetUserId: string) {
  await requireAdmin();

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, targetUserId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function stopImpersonation() {
  await requireAdmin();

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
}

export async function getImpersonatedUserId() {
  const cookieStore = await cookies();
  return cookieStore.get(IMPERSONATE_COOKIE)?.value ?? null;
}