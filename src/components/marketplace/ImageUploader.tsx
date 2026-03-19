"use client";

import { createSupabaseClient } from "@/lib/supabase/client";

export default function ImageUploader({
  onUpload,
}: {
  onUpload: (url: string) => void;
}) {
  const supabase = createSupabaseClient();

  async function handleFile(file: File) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Use userId as first path segment so RLS owner-check policy works:
    // split_part(name, '/', 1) = auth.uid()::text
    const path = `${user.id}/${crypto.randomUUID()}`;

    const { error } = await supabase.storage
      .from("marketplace")
      .upload(path, file);

    if (error) return;

    const { data } = supabase.storage
      .from("marketplace")
      .getPublicUrl(path);

    onUpload(data.publicUrl);
  }

  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          handleFile(e.target.files[0]);
        }
      }}
    />
  );
}
