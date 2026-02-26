"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

type Role = "user" | "creator" | "admin";

export default function NotificationsLiveClient({
  userId,
  role,
}: {
  userId: string;
  role: Role;
}) {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [status, setStatus] = useState<"idle" | "connected" | "reconnecting">("idle");

  useEffect(() => {
    const channel = supabase.channel(`notifications-live-${userId}-${role}`);

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "creator_requests",
        filter: `user_id=eq.${userId}`,
      },
      () => router.refresh()
    );

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "job_applications",
        filter: `applicant_id=eq.${userId}`,
      },
      () => router.refresh()
    );

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "marketplace_orders",
        filter: `buyer_id=eq.${userId}`,
      },
      () => router.refresh()
    );

    if (role === "creator" || role === "admin") {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_orders",
          filter: `seller_id=eq.${userId}`,
        },
        () => router.refresh()
      );
    }

    if (role === "admin") {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "creator_requests",
        },
        () => router.refresh()
      );

      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_orders",
          filter: "status=eq.paid",
        },
        () => router.refresh()
      );
    }

    channel.subscribe((event) => {
      if (event === "SUBSCRIBED") setStatus("connected");
      else if (event === "CLOSED" || event === "CHANNEL_ERROR" || event === "TIMED_OUT") {
        setStatus("reconnecting");
      }
    });

    const interval = setInterval(() => {
      router.refresh();
    }, 60000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [role, router, supabase, userId]);

  return (
    <p className="text-xs text-gray-500">
      Live updates: {status === "connected" ? "connected" : status === "reconnecting" ? "reconnecting..." : "starting..."}
    </p>
  );
}
