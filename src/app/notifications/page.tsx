import { Role } from "@/types";
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import NotificationsLiveClient from "./NotificationsLiveClient";
import {
  badgeClass,
  dedupeNotifications,
  formatRelativeTime,
  type NotificationItem,
} from "@/lib/notifications/helpers";

export const dynamic = "force-dynamic";


type JobApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  job: { title: string }[] | null;
};

type BuyerOrderRow = {
  id: string;
  status: string;
  created_at: string;
  item: { title: string }[] | null;
};

export default async function NotificationsPage() {
  const { user, supabase } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as Role | undefined) ?? "user";
  const notifications: NotificationItem[] = [];

  const [requestRes, userAppsRes, buyerOrdersRes] = await Promise.all([
    supabase
      .from("creator_requests")
      .select("id, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("job_applications")
      .select("id, status, created_at, job:jobs(title)")
      .eq("applicant_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<JobApplicationRow[]>(),
    supabase
      .from("marketplace_orders")
      .select("id, status, created_at, item:marketplace_items(title)")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<BuyerOrderRow[]>(),
  ]);

  if (!requestRes.error && requestRes.data && requestRes.data.length > 0) {
    const req = requestRes.data[0];
    if (req.status === "approved") {
      notifications.push({
        id: `creator-approved-${req.id}`,
        title: "Creator request approved",
        body: "You can now access creator dashboard features.",
        href: "/creator/dashboard",
        createdAt: req.created_at,
        type: "success",
      });
    } else if (req.status === "rejected") {
      notifications.push({
        id: `creator-rejected-${req.id}`,
        title: "Creator request rejected",
        body: "You can update your profile and apply again.",
        href: "/creator/apply",
        createdAt: req.created_at,
        type: "warning",
      });
    } else {
      notifications.push({
        id: `creator-pending-${req.id}`,
        title: "Creator request pending",
        body: "Your creator request is under review.",
        href: "/creator/apply",
        createdAt: req.created_at,
        type: "info",
      });
    }
  }

  if (!userAppsRes.error) {
    for (const app of userAppsRes.data ?? []) {
      if (app.status === "accepted" || app.status === "rejected") {
        notifications.push({
          id: `application-${app.id}`,
          title:
            app.status === "accepted"
              ? "Job application accepted"
              : "Job application rejected",
          body: app.job?.[0]?.title ?? "A job application was updated.",
          href: "/my-jobs",
          createdAt: app.created_at,
          type: app.status === "accepted" ? "success" : "warning",
        });
      }
    }
  }

  if (!buyerOrdersRes.error) {
    for (const order of buyerOrdersRes.data ?? []) {
      if (order.status === "shipped" || order.status === "delivered") {
        notifications.push({
          id: `order-${order.id}`,
          title:
            order.status === "delivered"
              ? "Order delivered"
              : "Order shipped",
          body: order.item?.[0]?.title ?? "A marketplace order was updated.",
          href: "/marketplace/orders",
          createdAt: order.created_at,
          type: order.status === "delivered" ? "success" : "info",
        });
      }
    }
  }

  if (role === "creator" || role === "admin") {
    const [creatorJobsRes, creatorCoursesRes, sellerOrdersRes] = await Promise.all([
      supabase
        .from("jobs")
        .select("id")
        .eq("creator_id", user.id),
      supabase
        .from("courses")
        .select("id")
        .eq("creator_id", user.id),
      supabase
        .from("marketplace_orders")
        .select("id, created_at, status, item:marketplace_items(title)")
        .eq("seller_id", user.id)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const jobIds = creatorJobsRes.data?.map((row) => row.id) ?? [];
    const courseIds = creatorCoursesRes.data?.map((row) => row.id) ?? [];

    if (jobIds.length > 0) {
      const { data } = await supabase
        .from("job_applications")
        .select("id, created_at, status")
        .in("job_id", jobIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      for (const app of data ?? []) {
        notifications.push({
          id: `creator-job-app-${app.id}`,
          title: "New job application",
          body: "A candidate applied to your job post.",
          href: "/creator/jobs",
          createdAt: app.created_at,
          type: "info",
        });
      }
    }

    if (courseIds.length > 0) {
      const { data } = await supabase
        .from("course_enrollments")
        .select("id, created_at")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false })
        .limit(5);

      for (const enrollment of data ?? []) {
        notifications.push({
          id: `creator-enrollment-${enrollment.id}`,
          title: "New course enrollment",
          body: "A learner enrolled in one of your courses.",
          href: "/creator/courses",
          createdAt: enrollment.created_at,
          type: "success",
        });
      }
    }

    for (const order of sellerOrdersRes.data ?? []) {
      notifications.push({
        id: `creator-order-${order.id}`,
        title: "Order needs shipment",
        body: (order.item as { title: string }[] | null)?.[0]?.title ?? "A paid order is waiting to ship.",
        href: "/creator/marketplace/orders",
        createdAt: order.created_at,
        type: "warning",
      });
    }
  }

  if (role === "admin") {
    const [pendingRequestsRes, paidOrdersRes] = await Promise.all([
      supabase
        .from("creator_requests")
        .select("id", { head: true, count: "exact" })
        .eq("status", "pending"),
      supabase
        .from("marketplace_orders")
        .select("id", { head: true, count: "exact" })
        .eq("status", "paid"),
    ]);

    if (!pendingRequestsRes.error && (pendingRequestsRes.count ?? 0) > 0) {
      notifications.push({
        id: "admin-pending-creator-requests",
        title: "Pending creator approvals",
        body: `${pendingRequestsRes.count ?? 0} creator requests need review.`,
        href: "/admin/creator-requests",
        createdAt: new Date().toISOString(),
        type: "warning",
      });
    }

    if (!paidOrdersRes.error && (paidOrdersRes.count ?? 0) > 0) {
      notifications.push({
        id: "admin-paid-orders",
        title: "Paid orders pending shipping",
        body: `${paidOrdersRes.count ?? 0} paid marketplace orders are pending shipping.`,
        href: "/admin/marketplace/orders",
        createdAt: new Date().toISOString(),
        type: "info",
      });
    }
  }

  const deduped = dedupeNotifications(notifications).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <main className="app-container max-w-5xl py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">Notifications</h1>
        <p className="text-sm text-slate-600">
          Role-aware updates for your account activity and pending actions.
        </p>
        <NotificationsLiveClient userId={user.id} role={role} />
      </header>

      {deduped.length === 0 ? (
        <section className="app-card rounded-xl p-6 text-sm text-slate-500">
          You are all caught up.
        </section>
      ) : (
        <section className="space-y-3">
          {deduped.map((item) => (
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
