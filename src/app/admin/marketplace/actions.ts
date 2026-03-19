"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function toggleListingPublished(itemId: string) {
  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("marketplace_items")
    .select("id, is_published")
    .eq("id", itemId)
    .single();

  if (error || !data) throw new Error("Listing not found");

  const { error: updateError } = await supabase
    .from("marketplace_items")
    .update({ is_published: !data.is_published })
    .eq("id", itemId);

  if (updateError) throw new Error("Failed to update listing");

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "admin_listing_publication_toggled",
    target_type: "marketplace_item",
    target_id: itemId,
    metadata: { isPublished: !data.is_published },
  });

  revalidatePath("/admin/marketplace");
  revalidatePath("/admin/dashboard");
}

export async function toggleListingSold(itemId: string) {
  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("marketplace_items")
    .select("id, is_sold")
    .eq("id", itemId)
    .single();

  if (error || !data) throw new Error("Listing not found");

  const { error: updateError } = await supabase
    .from("marketplace_items")
    .update({ is_sold: !data.is_sold })
    .eq("id", itemId);

  if (updateError) throw new Error("Failed to update sold status");

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "admin_listing_sold_toggled",
    target_type: "marketplace_item",
    target_id: itemId,
    metadata: { isSold: !data.is_sold },
  });

  revalidatePath("/admin/marketplace");
  revalidatePath("/admin/dashboard");
}

export async function deleteListing(itemId: string) {
  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("marketplace_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error("Failed to delete listing");

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "admin_listing_deleted",
    target_type: "marketplace_item",
    target_id: itemId,
  });

  revalidatePath("/admin/marketplace");
  revalidatePath("/admin/dashboard");
}
