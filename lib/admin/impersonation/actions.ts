"use server";

import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { IMPERSONATE_COOKIE } from "./constants";

export async function startImpersonation(userId: string) {
  await requireAdmin();

  const cookieStore = await cookies();

  cookieStore.set(IMPERSONATE_COOKIE, userId, {
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