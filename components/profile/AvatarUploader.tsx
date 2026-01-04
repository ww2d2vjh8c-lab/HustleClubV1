"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

type AvatarUploaderProps = {
  userId: string;
};

export default function AvatarUploader({ userId }: AvatarUploaderProps) {
  const supabase = createSupabaseClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    try {
      setUploading(true);
      setError(null);

      const filePath = `${userId}/avatar.png`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const avatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      window.location.reload();
    } catch (err: any) {
      setError(err.message ?? "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
      />

      {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
