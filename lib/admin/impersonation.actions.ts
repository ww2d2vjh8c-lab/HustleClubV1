"use server";

import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/supabase/auth";
import { IMPERSONATE_COOKIE } from "./impersonation.constants";

/**
 * Start impersonating a user (ADMIN ONLY)
 */
export async function startImpersonation(targetUserId: string) {
  await requireAdmin();

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, targetUserId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Stop impersonation (ADMIN ONLY)
 */
export async function stopImpersonation() {
  await requireAdmin();

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
}

/**
 * Read impersonated user id (internal use)
 */
export async function getImpersonatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(IMPERSONATE_COOKIE)?.value ?? null;
}