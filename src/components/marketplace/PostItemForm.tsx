"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import ImageUploader from "./ImageUploader";

export default function PostItemForm() {
  const supabase = createSupabaseClient();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("marketplace_items").insert({
      seller_id: user.id,
      title,
      description,
      price: Number(price),
      image_url: imageUrl,
      is_published: true,
    });

    if (error) {
      setError("Failed to post item");
      setLoading(false);
      return;
    }

    router.push("/marketplace");
  }

  return (
    <section className="border rounded-xl p-6 space-y-4 bg-white">
      <ImageUploader onUpload={setImageUrl} />

      <input
        placeholder="Item title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <textarea
        placeholder="Item description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        className="w-full border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
      >
        {loading ? "Posting..." : "Post item"}
      </button>
    </section>
  );
}
