"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/requireUser";
import { redirect } from "next/navigation";

export async function updateItem(
  itemId: string,
  formData: FormData
) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = Number(formData.get("price"));

  await supabase
    .from("marketplace_items")
    .update({
      title,
      description,
      price,
    })
    .eq("id", itemId)
    .eq("seller_id", user.id);

  redirect(`/marketplace/${itemId}`);
}

export async function deleteItem(itemId: string) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("marketplace_items")
    .delete()
    .eq("id", itemId)
    .eq("seller_id", user.id);

  redirect("/marketplace");
}
