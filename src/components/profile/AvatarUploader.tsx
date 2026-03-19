"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import LoadingButton from "@/components/ui/LoadingButton";

type AvatarUploaderProps = {
  userId: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Avatar upload failed";
}

export default function AvatarUploader({ userId }: AvatarUploaderProps) {
  const supabase = createSupabaseClient();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleUpload(file: File) {
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      if (!file.type.startsWith("image/")) {
        throw new Error("Please select a valid image file");
      }

      if (file.size > 3 * 1024 * 1024) {
        throw new Error("Image size must be less than 3MB");
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const filePath = `${userId}/avatar-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setSelectedFile(null);
      setSuccess("Avatar uploaded");
      router.refresh();
    } catch (error: unknown) {
      setError(getErrorMessage(error));
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
            setSelectedFile(e.target.files[0]);
          }
        }}
      />

      <LoadingButton
        isLoading={uploading}
        className="rounded-xl"
        onClick={() => {
          if (selectedFile) {
            return handleUpload(selectedFile);
          }
          setError("Choose an image before uploading");
        }}
      >
        Upload Avatar
      </LoadingButton>

      {success && <p className="text-sm text-green-600">{success}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
