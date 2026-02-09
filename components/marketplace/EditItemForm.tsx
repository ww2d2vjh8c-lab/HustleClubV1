"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function EditItemForm({ item }: { item: any }) {
  const supabase = createSupabaseClient();
  const router = useRouter();

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(item.price);
  const [published, setPublished] = useState(item.is_published);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);

    await supabase
      .from("marketplace_items")
      .update({
        title,
        description,
        price,
        is_published: published,
      })
      .eq("id", item.id);

    router.push("/marketplace/my-items");
  }

  async function remove() {
    if (!confirm("Delete this item?")) return;

    await supabase
      .from("marketplace_items")
      .delete()
      .eq("id", item.id);

    router.push("/marketplace/my-items");
  }

  return (
    <section className="border rounded-xl p-6 space-y-4 bg-white">
      <h2 className="text-lg font-semibold">Edit item</h2>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        Published
      </label>

      <button
        onClick={save}
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded"
      >
        Save changes
      </button>

      <button
        onClick={remove}
        className="w-full text-red-600 text-sm"
      >
        Delete item
      </button>
    </section>
  );
}
