"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createSupabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Give Supabase a moment to persist cookie
    setTimeout(() => {
      window.location.href = "/";
    }, 200);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white p-6 space-y-4 border rounded-xl shadow-sm"
      >
        <h1 className="text-2xl font-bold text-center">
          Welcome Back
        </h1>

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border px-3 py-2 rounded-md"
        />

        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border px-3 py-2 rounded-md"
        />

        {error && (
          <p className="text-red-500 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-md disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}