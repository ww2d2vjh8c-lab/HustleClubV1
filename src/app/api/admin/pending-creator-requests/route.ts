import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth";

export async function GET() {
  const auth = await requireAdmin().catch((error: unknown) =>
    error instanceof Error ? error : new Error("Unauthorized")
  );
  if (auth instanceof Error) {
    const status = auth.message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: auth.message }, { status });
  }
  const { supabase } = auth;

  const { count, error } = await supabase
    .from("creator_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
