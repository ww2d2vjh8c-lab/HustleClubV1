"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function PostItemButton() {
  const supabase = createSupabaseClient();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit() {
    if (!file || !title || !price) return;

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const filePath = `${user.id}/${Date.now()}.png`;

    await supabase.storage
      .from("marketplace")
      .upload(filePath, file);

    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/marketplace/${filePath}`;

    await supabase.from("marketplace_items").insert({
      user_id: user.id,
      title,
      price: Number(price),
      image_url: imageUrl,
      is_published: true,
    });

    window.location.href = "/marketplace";
  }

  return (
    <div className="space-y-4">
      <input
        placeholder="Title"
        className="w-full border p-2 rounded"
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        placeholder="Price"
        type="number"
        className="w-full border p-2 rounded"
        onChange={(e) => setPrice(e.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded"
      >
        {loading ? "Posting..." : "Post Item"}
      </button>
    </div>
  );
}
