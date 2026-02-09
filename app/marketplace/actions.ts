"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/requireUser";
import { redirect } from "next/navigation";

export async function publishItem(itemId: string) {
  const { user } = await requireUser(); // ✅ FIX
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("marketplace_items")
    .update({ is_published: true })
    .eq("id", itemId)
    .eq("seller_id", user.id);

  redirect("/marketplace/my-items");
}

export async function unpublishItem(itemId: string) {
  const { user } = await requireUser(); // ✅ FIX
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("marketplace_items")
    .update({ is_published: false })
    .eq("id", itemId)
    .eq("seller_id", user.id);

  redirect("/marketplace/my-items");
}

export async function deleteItem(itemId: string) {
  const { user } = await requireUser(); // ✅ FIX
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("marketplace_items")
    .delete()
    .eq("id", itemId)
    .eq("seller_id", user.id);

  redirect("/marketplace/my-items");
}