import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DeleteItemPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser("/marketplace/my-items");
  const supabase = await createSupabaseServerClient();

  const { data: item } = await supabase
    .from("marketplace_items")
    .select("id, title")
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

  async function deleteItem() {
    "use server";

    const supabase = await createSupabaseServerClient();
    await supabase
      .from("marketplace_items")
      .delete()
      .eq("id", params.id)
      .eq("seller_id", user.id);

    redirect("/marketplace/my-items");
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-red-600">
        Delete Item
      </h1>

      <p>
        Are you sure you want to delete{" "}
        <strong>{item.title}</strong>?
      </p>

      <form action={deleteItem} className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 rounded bg-red-600 text-white"
        >
          Yes, delete
        </button>

        <button
          type="button"
          onClick={() => redirect("/marketplace/my-items")}
          className="px-4 py-2 rounded border"
        >
          Cancel
        </button>
      </form>
    </main>
  );
}
