import { requireCreator } from "@/lib/supabase/requireCreator";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";

export const dynamic = "force-dynamic";

type ItemUpdatePayload = {
  title: string;
  description: string;
  price: number;
  image_url?: string;
};

/* ================= SERVER ACTIONS ================= */

async function updateItem(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = Number(formData.get("price"));
  const file = formData.get("image") as File;

  let imageUrl: string | undefined;

  // Upload new image if provided
  if (file && file.size > 0) {
    const fileName = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("marketplace")
      .upload(fileName, file);

    if (uploadError) {
      console.log("UPLOAD ERROR:", uploadError);
      throw new Error("Image upload failed");
    }

    const { data } = supabase.storage
      .from("marketplace")
      .getPublicUrl(fileName);

    imageUrl = data.publicUrl;
  }

  const updatePayload: ItemUpdatePayload = {
    title,
    description,
    price,
  };

  if (imageUrl) {
    updatePayload.image_url = imageUrl;
  }

  const { error } = await supabase
    .from("marketplace_items")
    .update(updatePayload)
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) {
    console.log("UPDATE ERROR:", error);
    throw new Error("Failed to update item");
  }

  redirect(`/creator/marketplace/${id}`);
}

async function removeImage(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("marketplace_items")
    .update({ image_url: null })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) {
    throw new Error("Failed to remove image");
  }

  redirect(`/creator/marketplace/${id}`);
}

async function publishItem(formData: FormData) {
  "use server";
  const { user, supabase } = await requireCreator();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("marketplace_items")
    .update({ is_published: true })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) {
    throw new Error("Failed to publish item");
  }

  redirect(`/creator/marketplace/${id}`);
}

async function unpublishItem(formData: FormData) {
  "use server";
  const { user, supabase } = await requireCreator();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("marketplace_items")
    .update({ is_published: false })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) {
    throw new Error("Failed to unpublish item");
  }

  redirect(`/creator/marketplace/${id}`);
}

async function markSold(formData: FormData) {
  "use server";
  const { user, supabase } = await requireCreator();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("marketplace_items")
    .update({ is_sold: true })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) {
    throw new Error("Failed to mark item as sold");
  }

  redirect(`/creator/marketplace/${id}`);
}

async function deleteItem(formData: FormData) {
  "use server";
  const { user, supabase } = await requireCreator();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("marketplace_items")
    .delete()
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) {
    throw new Error("Failed to delete item");
  }

  redirect("/creator/marketplace");
}

/* ================= PAGE ================= */

export default async function ManageMarketplaceItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { user, supabase } = await requireCreator();

  const { data: item, error } = await supabase
    .from("marketplace_items")
    .select("*")
    .eq("id", id)
    .eq("seller_id", user.id)
    .single();

  if (error || !item) {
    notFound();
  }

  let status = "Draft";
  let statusColor = "text-gray-500";

  if (item.is_sold) {
    status = "Sold";
    statusColor = "text-red-600";
  } else if (item.is_published) {
    status = "Published";
    statusColor = "text-green-600";
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-10">
      <header>
        <h1 className="text-2xl font-bold">Manage Item</h1>
        <p className="text-sm text-gray-600">{item.title}</p>
      </header>

      {/* IMAGE PREVIEW */}
      {item.image_url && (
        <div className="space-y-3">
          <div className="relative h-64 rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              className="object-cover"
            />
          </div>

          <form action={removeImage}>
            <input type="hidden" name="id" value={item.id} />
            <button className="text-sm text-red-600">
              Remove Image
            </button>
          </form>
        </div>
      )}

      {/* EDIT FORM */}
      <form
        action={updateItem}
        className="border rounded-xl p-6 bg-white space-y-6"
      >
        <input type="hidden" name="id" value={item.id} />

        <div>
          <label className="block text-sm mb-2">Title</label>
          <input
            name="title"
            defaultValue={item.title}
            className="w-full border rounded-md px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Description</label>
          <textarea
            name="description"
            defaultValue={item.description}
            rows={4}
            className="w-full border rounded-md px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Price (₹)</label>
          <input
            name="price"
            type="number"
            defaultValue={item.price ?? 0}
            className="w-full border rounded-md px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-2">
            Replace Image (optional)
          </label>
          <input type="file" name="image" accept="image/*" />
        </div>

        <button className="px-6 py-2 bg-black text-white rounded-md">
          Save Changes
        </button>
      </form>

      {/* STATUS */}
      <div className={`text-sm font-medium ${statusColor}`}>
        Status: {status}
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap gap-3">

        {!item.is_published && !item.is_sold && (
          <form action={publishItem}>
            <input type="hidden" name="id" value={item.id} />
            <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm">
              Publish
            </button>
          </form>
        )}

        {item.is_published && !item.is_sold && (
          <form action={unpublishItem}>
            <input type="hidden" name="id" value={item.id} />
            <button className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm">
              Unpublish
            </button>
          </form>
        )}

        {!item.is_sold && (
          <form action={markSold}>
            <input type="hidden" name="id" value={item.id} />
            <button className="px-4 py-2 bg-black text-white rounded-md text-sm">
              Mark as Sold
            </button>
          </form>
        )}

        <form action={deleteItem}>
          <input type="hidden" name="id" value={item.id} />
          <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm">
            Delete
          </button>
        </form>
      </div>
    </main>
  );
}
