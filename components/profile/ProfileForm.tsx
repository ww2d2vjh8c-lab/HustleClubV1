"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  normalizeUsername,
  validateBio,
  validateFullName,
  validateUsername,
} from "@/lib/profile/validation";

type ProfileFormProps = {
  userId: string;
  email: string;
  initialUsername: string | null;
  initialFullName: string | null;
  initialBio: string | null;
};

export default function ProfileForm({
  userId,
  email,
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
  const [usernameHint, setUsernameHint] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    setUsernameHint(null);

    const normalizedUsername = normalizeUsername(username);
    const normalizedName = fullName.trim();
    const normalizedBio = bio.trim();

    const usernameError = validateUsername(normalizedUsername);
    if (usernameError) {
      setError(usernameError);
      setSaving(false);
      return;
    }

    const fullNameError = validateFullName(normalizedName);
    if (fullNameError) {
      setError(fullNameError);
      setSaving(false);
      return;
    }

    const bioError = validateBio(normalizedBio);
    if (bioError) {
      setError(bioError);
      setSaving(false);
      return;
    }

    if (normalizedUsername) {
      const { data: existing, error: existingError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", normalizedUsername)
        .neq("id", userId)
        .limit(1);

      if (existingError) {
        setError("Could not verify username availability");
        setSaving(false);
        return;
      }

      if (existing && existing.length > 0) {
        setError("This username is already taken");
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: normalizedUsername || null,
        full_name: normalizedName || null,
        bio: normalizedBio || null,
      })
      .eq("id", userId);

    if (error) {
      if (error.code === "23505") {
        setError("This username is already taken");
      } else {
        setError("Failed to save profile");
      }
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
    if (normalizedUsername) {
      setUsernameHint(`/u/${normalizedUsername}`);
    }
  }

  return (
    <section className="app-card rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold font-[var(--font-display)]">Profile Details</h2>

      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <input
          value={email}
          disabled
          className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(normalizeUsername(e.target.value))}
          placeholder="yourname"
          className="w-full rounded-xl px-3 py-2 text-sm"
          maxLength={24}
        />
        <p className="text-xs text-gray-500">
          3-24 chars: lowercase letters, numbers, underscore
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Full name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          className="w-full rounded-xl px-3 py-2 text-sm"
          maxLength={80}
        />
        <p className="text-xs text-gray-500">{fullName.trim().length}/80</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell people what you do"
          rows={3}
          className="w-full rounded-xl px-3 py-2 text-sm"
          maxLength={280}
        />
        <p className="text-xs text-gray-500">{bio.trim().length}/280</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">
          Profile saved successfully{usernameHint ? ` - public URL: ${usernameHint}` : ""}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </section>
  );
}
