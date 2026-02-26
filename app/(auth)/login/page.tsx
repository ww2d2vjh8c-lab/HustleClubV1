"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const supabase = createSupabaseClient();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const verifyHint = searchParams.get("verify");
  const next = searchParams.get("next");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCanResendVerification(false);
    setResendMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError("Please verify your email first, then login.");
        setCanResendVerification(true);
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    window.location.href = next || "/";
  }

  async function handleResendVerification() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Enter your email first.");
      return;
    }

    setResendLoading(true);
    setError(null);
    setResendMessage(null);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
    });

    if (error) {
      setError(error.message);
      setResendLoading(false);
      return;
    }

    setResendMessage("Verification email sent. Please check your inbox.");
    setResendLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="app-surface w-full max-w-md rounded-2xl p-7 space-y-5"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold font-[var(--font-display)]">Welcome back</h1>
          <p className="text-sm text-slate-600">Login to continue your HustleClub journey.</p>
        </div>

        {verifyHint === "1" && (
          <p className="text-sm rounded border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2">
            Account created. Verify your email, then log in.
          </p>
        )}

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full px-3 py-2.5 rounded-xl"
        />

        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-3 py-2.5 rounded-xl"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {canResendVerification && (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading}
            className="text-sm underline disabled:opacity-50"
          >
            {resendLoading ? "Sending..." : "Resend verification email"}
          </button>
        )}
        {resendMessage && <p className="text-green-600 text-sm">{resendMessage}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-medium hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-center text-sm text-slate-600">
          New here? <Link href="/signup" className="font-medium underline">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
