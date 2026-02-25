import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/* ================= SERVER ACTION ================= */

async function markSold(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("marketplace_items")
    .update({ is_sold: true })
    .eq("id", id);

  redirect("/marketplace");
}

/* ================= PAGE ================= */

export default async function MarketplaceItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: item, error } = await supabase
    .from("marketplace_items")
    .select("*")
    .eq("id", Number(id))
    .eq("is_published", true)
    .single();

  if (error || !item) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <h1 className="text-3xl font-bold">
        {item.title}
      </h1>

      {item.image_url && (
        <div className="h-72 bg-gray-100 rounded-xl overflow-hidden">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <p className="text-xl font-semibold">
        ₹{item.price ?? 0}
      </p>

      <p className="text-gray-700">
        {item.description}
      </p>

      {!item.is_sold && (
        <form action={markSold}>
          <input type="hidden" name="id" value={item.id} />
          <button className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition">
            Buy Item
          </button>
        </form>
      )}

      {item.is_sold && (
        <div className="text-red-600 font-medium">
          This item has been sold.
        </div>
      )}
    </main>
  );
}