import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/* ================= SERVER ACTION ================= */

async function markSold(formData: FormData) {
  "use server";

  const id = formData.get("id") as string; // ✅ UUID string
  const supabase = await createSupabaseServerClient();

  if (!id) return;

  await supabase
    .from("marketplace_items")
    .update({ is_sold: true })
    .eq("id", id); // ✅ no Number()

  redirect("/marketplace");
}

/* ================= PAGE ================= */

export default async function MarketplaceItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ UUID string

  const supabase = await createSupabaseServerClient();

  if (!id) {
    notFound();
  }

  const { data: item, error } = await supabase
    .from("marketplace_items")
    .select("*")
    .eq("id", id) // ✅ no Number()
    .eq("is_published", true)
    .single();

  if (error || !item) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      {/* TITLE */}
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">
          {item.title}
        </h1>
        <p className="text-gray-500 text-sm">
          Listed on {new Date(item.created_at).toLocaleDateString()}
        </p>
      </header>

      {/* IMAGE */}
      {item.image_url && (
        <div className="h-80 bg-gray-100 rounded-xl overflow-hidden">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* PRICE */}
      <div className="text-2xl font-semibold">
        ₹{item.price ?? 0}
      </div>

      {/* DESCRIPTION */}
      <p className="text-gray-700 whitespace-pre-line">
        {item.description}
      </p>

      {/* ACTION */}
      {!item.is_sold ? (
        <form action={markSold}>
          <input type="hidden" name="id" value={item.id} />
          <button className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition">
            Buy Item
          </button>
        </form>
      ) : (
        <div className="text-red-600 font-medium">
          This item has been sold.
        </div>
      )}
    </main>
  );
}