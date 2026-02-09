"use client";

import { useState } from "react";

type Props = {
  userId: string;
};

export default function CreatorApplyForm({ userId }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/creator/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Failed to submit request");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="p-4 rounded-lg bg-green-50 text-green-700 text-sm">
        ✅ Your creator request has been submitted.
        <br />
        Our team will review it shortly.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border rounded-xl p-6 bg-white"
    >
      <div>
        <label className="block text-sm font-medium mb-1">
          Why do you want to become a creator?
        </label>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className="w-full border rounded-lg p-3 text-sm"
          placeholder="Tell us about your experience, what you want to teach, or what you plan to sell…"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2.5 rounded-lg bg-black text-white text-sm disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit Request"}
      </button>
    </form>
  );
}
