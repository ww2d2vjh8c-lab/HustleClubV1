"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { validateFullName, validatePassword } from "@/lib/profile/validation";
import Link from "next/link";

export default function SignupPage() {
  const supabase = createSupabaseClient();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  function validateForm() {
    const normalizedEmail = email.trim();
    const normalizedPassword = password;
    const normalizedFullName = fullName.trim();

    if (!normalizedEmail) return "Email is required";
    const passwordError = validatePassword(normalizedPassword);
    if (passwordError) return passwordError;
    if (normalizedPassword !== confirmPassword) return "Passwords do not match";
    const fullNameError = validateFullName(normalizedFullName);
    if (fullNameError) return fullNameError;

    return null;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsEmailVerification(false);
    setVerificationMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim() || null,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setNeedsEmailVerification(true);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setNeedsEmailVerification(true);
      setLoading(false);
      return;
    }

    router.push("/profile");
  }

  async function handleResendVerification() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Enter your email to resend verification");
      return;
    }

    setResendingVerification(true);
    setError(null);
    setVerificationMessage(null);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
    });

    if (error) {
      setError(error.message);
      setResendingVerification(false);
      return;
    }

    setVerificationMessage("Verification email sent. Please check your inbox.");
    setResendingVerification(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSignup}
        className="app-surface w-full max-w-md rounded-2xl p-7 space-y-5"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold font-[var(--font-display)]">Create your account</h1>
          <p className="text-sm text-slate-600">Get access to courses, jobs, and marketplace in one place.</p>
        </div>

        <input
          type="text"
          placeholder="Full name"
          className="w-full rounded-xl px-3 py-2.5"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={80}
        />

        <input
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-xl px-3 py-2.5"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          required
          placeholder="Password"
          className="w-full rounded-xl px-3 py-2.5"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          required
          placeholder="Confirm password"
          className="w-full rounded-xl px-3 py-2.5"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <p className="text-xs text-gray-500">
          Use at least 8 characters with letters and numbers.
        </p>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {needsEmailVerification && (
          <div className="text-sm rounded-lg border border-blue-200 bg-blue-50 text-blue-700 p-3 space-y-2">
            <p>
              Account created. Check your email and verify your account before logging in.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="underline disabled:opacity-50"
              >
                {resendingVerification ? "Sending..." : "Resend verification email"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/login?verify=1")}
                className="underline"
              >
                Go to login
              </button>
            </div>
            {verificationMessage ? <p>{verificationMessage}</p> : null}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || needsEmailVerification}
          className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-medium hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Creating..." : "Sign up"}
        </button>

        <p className="text-center text-sm text-slate-600">
          Already have an account? <Link href="/login" className="font-medium underline">Login</Link>
        </p>
      </form>
    </div>
  );
}
