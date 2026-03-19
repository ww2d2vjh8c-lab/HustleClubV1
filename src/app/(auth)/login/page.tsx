"use client";

import { useState, useTransition } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const supabase = createSupabaseClient();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const verifyHint = searchParams.get("verify");
  const next = searchParams.get("next");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
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
        return;
      }

      window.location.href = next || "/";
    });
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
          <h1 className="text-2xl font-semibold font-[var(--font-display)]">
            Welcome back
          </h1>
          <p className="text-sm text-slate-600">
            Login to continue your HustleClub journey.
          </p>
        </div>

        {error && (
          <p className="text-sm rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2">
            {error}
          </p>
        )}

        {verifyHint === "1" && !error && (
          <p className="text-sm rounded border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2">
            Account created. Verify your email, then log in.
          </p>
        )}

        {resendMessage && !error && (
          <p className="text-sm rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2">
            {resendMessage}
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

        <div className="space-y-3">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-black text-white rounded-xl px-3 py-2.5 text-sm font-semibold shadow-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {isPending ? "Signing In..." : "Sign In"}
          </button>

          {canResendVerification && (
            <button
              type="button"
              disabled={resendLoading}
              onClick={handleResendVerification}
              className="w-full bg-slate-100 text-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-200 disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend Verification Email"}
            </button>
          )}
        </div>

        <p className="text-center text-sm text-slate-600">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-black hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}