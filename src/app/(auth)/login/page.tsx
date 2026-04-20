"use client";

import { useState, useTransition } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const supabase = createSupabaseClient();
  const searchParams = useSearchParams();
  const router = useRouter();

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

      router.push(next || "/");
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
          onSubmit={handleLogin}
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
            WELCOME BACK
          </h1>
          <p style={{ textAlign: "center", color: "var(--text-1)", fontSize: ".85rem", marginBottom: "1.5rem" }}>
            Sign in to your HustleClub account
          </p>

          {/* Status messages */}
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
          {verifyHint === "1" && !error && (
            <div style={{
              padding: ".65rem .85rem",
              background: "rgba(0,238,255,.06)",
              border: "1px solid rgba(0,238,255,.2)",
              borderRadius: "var(--radius-sm)",
              color: "var(--neon-cyan)",
              fontSize: ".82rem",
              marginBottom: "1rem",
              fontFamily: "var(--font-mono), monospace",
            }}>
              Account created — verify your email then log in.
            </div>
          )}
          {resendMessage && !error && (
            <div style={{
              padding: ".65rem .85rem",
              background: "rgba(0,232,122,.06)",
              border: "1px solid rgba(0,232,122,.2)",
              borderRadius: "var(--radius-sm)",
              color: "var(--neon-green)",
              fontSize: ".82rem",
              marginBottom: "1rem",
              fontFamily: "var(--font-mono), monospace",
            }}>
              {resendMessage}
            </div>
          )}

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <label className="field-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field-input"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="btn-neon-solid"
            style={{
              width: "100%",
              fontSize: "1rem",
              padding: ".7rem",
              opacity: isPending ? .6 : 1,
              justifyContent: "center",
            }}
          >
            {isPending ? "SIGNING IN..." : "SIGN IN →"}
          </button>

          {canResendVerification && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="btn-ghost"
              style={{ width: "100%", marginTop: ".65rem", justifyContent: "center", fontSize: ".82rem" }}
            >
              {resendLoading ? "SENDING..." : "Resend verification email"}
            </button>
          )}

          <p style={{ textAlign: "center", fontSize: ".82rem", color: "var(--text-1)", marginTop: "1.25rem" }}>
            New to HustleClub?{" "}
            <Link href="/signup" style={{ color: "var(--neon-orange)", fontWeight: 600 }}>
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
