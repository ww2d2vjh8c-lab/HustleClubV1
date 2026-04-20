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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Brand mark */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "3rem", height: "3rem",
            background: "var(--neon-orange)",
            color: "#000",
            fontFamily: "var(--font-display), cursive",
            fontSize: "1.6rem", fontWeight: 900,
            borderRadius: "6px",
            boxShadow: "var(--glow-orange-sm)",
          }}>H</span>
        </div>

        <form
          onSubmit={handleSignup}
          style={{
            background: "var(--surface-strong)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            padding: "2rem",
          }}
        >
          <h1 style={{
            fontFamily: "var(--font-display), cursive",
            fontSize: "1.8rem",
            letterSpacing: ".06em",
            color: "var(--text-0)",
            marginBottom: ".35rem",
            textAlign: "center",
          }}>
            CREATE ACCOUNT
          </h1>
          <p style={{ textAlign: "center", color: "var(--text-1)", fontSize: ".85rem", marginBottom: "1.5rem" }}>
            Join HustleClub for free
          </p>

          {/* Error message */}
          {error && (
            <div style={{
              padding: ".65rem .85rem",
              background: "rgba(255,50,80,.07)",
              border: "1px solid rgba(255,50,80,.25)",
              borderRadius: "var(--radius-sm)",
              color: "#FF5566",
              fontSize: ".82rem",
              marginBottom: "1rem",
              fontFamily: "var(--font-mono), monospace",
            }}>
              {error}
            </div>
          )}

          {/* Email verification banner */}
          {needsEmailVerification && (
            <div style={{
              padding: ".75rem .85rem",
              background: "rgba(0,238,255,.06)",
              border: "1px solid rgba(0,238,255,.2)",
              borderRadius: "var(--radius-sm)",
              color: "var(--neon-cyan)",
              fontSize: ".82rem",
              marginBottom: "1rem",
              fontFamily: "var(--font-mono), monospace",
              display: "flex",
              flexDirection: "column",
              gap: ".5rem",
            }}>
              <p style={{ margin: 0 }}>
                Account created. Check your email and verify before logging in.
              </p>
              <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="btn-ghost"
                  style={{
                    padding: 0,
                    fontSize: ".82rem",
                    opacity: resendingVerification ? 0.5 : 1,
                    cursor: resendingVerification ? "not-allowed" : "pointer",
                  }}
                >
                  {resendingVerification ? "SENDING..." : "Resend verification email"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/login?verify=1")}
                  className="btn-ghost"
                  style={{ padding: 0, fontSize: ".82rem" }}
                >
                  Go to login →
                </button>
              </div>
              {verificationMessage && (
                <p style={{ margin: 0, color: "var(--neon-green)" }}>{verificationMessage}</p>
              )}
            </div>
          )}

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <label className="field-label" htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={80}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="field-input"
              />
            </div>
          </div>

          <p style={{ fontSize: ".78rem", color: "var(--text-2)", fontFamily: "var(--font-mono), monospace", marginBottom: "1.25rem" }}>
            Use at least 8 characters with letters and numbers.
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || needsEmailVerification}
            className="btn-neon-solid"
            style={{
              width: "100%",
              fontSize: "1rem",
              padding: ".7rem",
              opacity: loading || needsEmailVerification ? .6 : 1,
              justifyContent: "center",
              cursor: loading || needsEmailVerification ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT →"}
          </button>

          <p style={{ textAlign: "center", fontSize: ".82rem", color: "var(--text-1)", marginTop: "1.25rem" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--neon-orange)", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
