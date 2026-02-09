import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import EditItemForm from "@/components/marketplace/EditItemForm";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser("/marketplace/my-items");
  const supabase = await createSupabaseServerClient();

  const { data: item } = await supabase
    .from("marketplace_items")
    .select("*")
    .eq("id", params.id)
    .eq("seller_id", user.id)
    .single();

  if (!item) {
    return (
      <div className="max-w-xl mx-auto p-6 text-red-500">
        Item not found.
      </div>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-12">
      <EditItemForm item={item} />
    </main>
  );
}
