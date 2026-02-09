import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * DEPRECATED:
 * This route previously hosted a CREATOR dashboard.
 * Creators now live under /creator/dashboard.
 */
export default function DeprecatedAdminDashboard() {
  redirect("/creator/dashboard");
}