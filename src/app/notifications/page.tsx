import type { Role } from "@/types";
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import NotificationsLiveClient from "./NotificationsLiveClient";
import { badgeClass, formatRelativeTime } from "@/lib/notifications/helpers";
import { fetchNotifications } from "@/lib/services/notifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const { user, supabase } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as Role | undefined) ?? "user";
  const notifications = await fetchNotifications(supabase, user.id, role);

  return (
    <main className="app-container max-w-5xl py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">Notifications</h1>
        <p className="text-sm text-slate-600">
          Role-aware updates for your account activity and pending actions.
        </p>
        <NotificationsLiveClient userId={user.id} role={role} />
      </header>

      {notifications.length === 0 ? (
        <section className="app-card rounded-xl p-6 text-sm text-slate-500">
          You are all caught up.
        </section>
      ) : (
        <section className="space-y-3">
          {notifications.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="app-card block rounded-xl p-4 hover:bg-slate-50 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{item.body}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${badgeClass(item.type)}`}>
                  {item.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-3">{formatRelativeTime(item.createdAt)}</p>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
