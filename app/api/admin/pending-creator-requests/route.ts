import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth";

export async function GET() {
  const { supabase } = await requireAdmin();

  const { count, error } = await supabase
    .from("creator_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
