import { requireCreator } from "@/lib/supabase/requireCreator";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/* ================= SERVER ACTION ================= */

async function createItem(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = Number(formData.get("price"));

  if (!title) {
    throw new Error("Title is required");
  }

  const { error } = await supabase
    .from("marketplace_items")
    .insert({
      title,
      description,
      price,
      seller_id: user.id,
      is_published: false,
      is_sold: false,
    });

  if (error) {
    console.log("CREATE ITEM ERROR:", error);
    throw new Error("Failed to create item");
  }

  redirect("/creator/marketplace");
}

/* ================= PAGE ================= */

export default async function NewMarketplaceItemPage() {
  await requireCreator(); // 🔐 Protect route

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">
          Add Marketplace Item
        </h1>
        <p className="text-gray-600 text-sm">
          Create a new item listing (saved as draft)
        </p>
      </header>

      <form
        action={createItem}
        className="space-y-6"
      >
        <div>
          <label className="block text-sm font-medium mb-2">
            Title
          </label>
          <input
            name="title"
            required
            className="w-full border rounded-md px-4 py-2"
            placeholder="Item title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            name="description"
            rows={4}
            className="w-full border rounded-md px-4 py-2"
            placeholder="Describe your item"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Price (₹)
          </label>
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            required
            className="w-full border rounded-md px-4 py-2"
            placeholder="0"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition"
        >
          Create Item
        </button>
      </form>
    </main>
  );
}