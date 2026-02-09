import { cookies } from "next/headers";
import { IMPERSONATE_COOKIE } from "./constants";

export async function getImpersonatedUserId() {
  const cookieStore = await cookies();
  return cookieStore.get(IMPERSONATE_COOKIE)?.value ?? null;
}