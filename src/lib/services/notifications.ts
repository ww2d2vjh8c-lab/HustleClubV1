import type { SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "@/types";
import { dedupeNotifications, type NotificationItem } from "@/lib/notifications/helpers";

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

export async function fetchNotifications(
  supabase: SupabaseClient,
  userId: string,
  role: Role
): Promise<NotificationItem[]> {
  const notifications: NotificationItem[] = [];

  const [requestRes, userAppsRes, buyerOrdersRes] = await Promise.all([
    supabase
      .from("creator_requests")
      .select("id, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("job_applications")
      .select("id, status, created_at, job:jobs(title)")
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<JobApplicationRow[]>(),
    supabase
      .from("marketplace_orders")
      .select("id, status, created_at, item:marketplace_items(title)")
      .eq("buyer_id", userId)
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
    await fetchCreatorNotifications(supabase, userId, notifications);
  }

  if (role === "admin") {
    await fetchAdminNotifications(supabase, notifications);
  }

  return dedupeNotifications(notifications).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

async function fetchCreatorNotifications(
  supabase: SupabaseClient,
  userId: string,
  notifications: NotificationItem[]
) {
  const [creatorJobsRes, creatorCoursesRes, sellerOrdersRes] = await Promise.all([
    supabase.from("jobs").select("id").eq("creator_id", userId),
    supabase.from("courses").select("id").eq("creator_id", userId),
    supabase
      .from("marketplace_orders")
      .select("id, created_at, status, item:marketplace_items(title)")
      .eq("seller_id", userId)
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

async function fetchAdminNotifications(
  supabase: SupabaseClient,
  notifications: NotificationItem[]
) {
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
