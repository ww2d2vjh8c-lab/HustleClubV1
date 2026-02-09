"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  userId: string;
  initialUsername: string | null;
  initialFullName: string | null;
  initialBio: string | null;
};

export default function ProfileForm({
  userId,
  initialUsername,
  initialFullName,
  initialBio,
}: ProfileFormProps) {
  const supabase = createSupabaseClient();

  const [username, setUsername] = useState(initialUsername ?? "");
  const [fullName, setFullName] = useState(initialFullName ?? "");
  const [bio, setBio] = useState(initialBio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim() || null,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
      })
      .eq("id", userId);

    if (error) {
      setError("Failed to save profile");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
  }

  return (
    <section className="border rounded-xl p-6 space-y-4 bg-white">
      <h2 className="text-lg font-semibold">Profile Details</h2>

      <div className="space-y-1">
        <label className="text-sm font-medium">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="yourname"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Full name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell people what you do"
          rows={3}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">Profile saved successfully</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </section>
  );
}
