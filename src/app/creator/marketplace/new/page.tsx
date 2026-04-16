import { requireCreator } from "@/lib/supabase/requireCreator";
import { redirect } from "next/navigation";
import {
  buildMarketplaceDescription,
  textareaToList,
} from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

/* ================= SERVER ACTION ================= */

async function createItem(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();

  const title = formData.get("title") as string;
  const highlights = formData.get("highlights") as string;
  const conditionDetails = formData.get("conditionDetails") as string;
  const shipping = formData.get("shipping") as string;
  const whySelling = formData.get("whySelling") as string;
  const specifications = textareaToList(String(formData.get("specifications") ?? ""));
  const price = Number(formData.get("price"));
  const file = formData.get("image") as File | null;

  if (!title.trim() || !highlights.trim()) {
    throw new Error("Title and highlights are required");
  }

  let imageUrl: string | null = null;

  // ✅ Upload image if provided
  if (file && file.size > 0) {
    const fileName = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("marketplace")
      .upload(fileName, file);

    if (uploadError) {
      throw new Error("Image upload failed");
    }

    const { data } = supabase.storage
      .from("marketplace")
      .getPublicUrl(fileName);

    imageUrl = data.publicUrl;
  }

  const { error } = await supabase
    .from("marketplace_items")
    .insert({
      title,
      description: buildMarketplaceDescription({
        highlights,
        conditionDetails,
        specifications,
        shipping,
        whySelling,
      }),
      price: Number.isNaN(price) ? 0 : price,
      seller_id: user.id,
      image_url: imageUrl,
      is_published: false,
      is_sold: false,
    });

  if (error) {
    throw new Error("Failed to create item");
  }

  redirect("/creator/marketplace");
}

/* ================= PAGE ================= */

export default async function NewMarketplaceItemPage() {
  await requireCreator();

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">
        Add Marketplace Item
      </h1>

      <form
        action={createItem}
        className="space-y-6"
      >
        <div>
          <label className="block mb-2 text-sm font-medium">
            Title
          </label>
          <input
            name="title"
            required
            className="w-full border rounded-md px-4 py-2"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">
            Description
          </label>
          <textarea
            name="highlights"
            rows={4}
            className="w-full border rounded-md px-4 py-2"
            placeholder="Product highlights and why someone should buy this"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="conditionDetails"
            placeholder="Condition details (e.g. Like new, 2 minor scratches)"
            className="w-full border rounded-md px-4 py-2"
          />
          <input
            name="shipping"
            placeholder="Shipping/dispatch info"
            className="w-full border rounded-md px-4 py-2"
          />
        </div>

        <textarea
          name="specifications"
          rows={3}
          className="w-full border rounded-md px-4 py-2"
          placeholder="Specifications (one point per line)"
        />

        <textarea
          name="whySelling"
          rows={2}
          className="w-full border rounded-md px-4 py-2"
          placeholder="Reason for selling (build buyer trust)"
        />

        <div>
          <label className="block mb-2 text-sm font-medium">
            Price (₹)
          </label>
          <input
            name="price"
            type="number"
            required
            className="w-full border rounded-md px-4 py-2"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">
            Item Image
          </label>
          <input
            name="image"
            type="file"
            accept="image/*"
            className="w-full"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-black text-white rounded-md"
        >
          Create Item
        </button>
      </form>
    </main>
  );
}
