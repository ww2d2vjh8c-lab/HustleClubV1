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
      padding: "1.5rem",
      background: "#0a0a0a",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        position: "relative",
      }}>
        {/* Corner brackets */}
        {[
          { top: 0, left: 0, borderTop: "1px solid #FF6B00", borderLeft: "1px solid #FF6B00" },
          { top: 0, right: 0, borderTop: "1px solid #FF6B00", borderRight: "1px solid #FF6B00" },
          { bottom: 0, left: 0, borderBottom: "1px solid #FF6B00", borderLeft: "1px solid #FF6B00" },
          { bottom: 0, right: 0, borderBottom: "1px solid #FF6B00", borderRight: "1px solid #FF6B00" },
        ].map((c, i) => (
          <div key={i} style={{
            position: "absolute",
            top: c.top,
            right: c.right,
            bottom: c.bottom,
            left: c.left,
            width: "20px",
            height: "20px",
            borderTop: c.borderTop,
            borderBottom: c.borderBottom,
            borderLeft: c.borderLeft,
            borderRight: c.borderRight,
            opacity: 0.7,
            pointerEvents: "none",
            zIndex: 2,
          }} />
        ))}

        <form
          onSubmit={handleLogin}
          style={{
            background: "#111111",
            border: "1px solid #222222",
            borderRadius: "4px",
            padding: "2.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: ".25rem" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "3rem",
              height: "3rem",
              background: "#FF6B00",
              color: "#000",
              fontFamily: "'Bebas Neue', 'Arial Black', cursive",
              fontSize: "1.5rem",
              fontWeight: 900,
              borderRadius: "3px",
              boxShadow: "0 0 16px rgba(255, 107, 0, 0.5)",
              marginBottom: ".75rem",
            }}>H</div>
            <h1 style={{
              fontFamily: "'Bebas Neue', 'Arial Black', cursive",
              fontSize: "2.2rem",
              letterSpacing: ".08em",
              margin: 0,
              color: "#ffffff",
            }}>WELCOME BACK</h1>
            <p style={{ color: "#888888", fontSize: ".85rem", marginTop: ".35rem" }}>
              Sign in to your HustleClub account
            </p>
          </div>

          {/* Status messages */}
          {error && (
            <div style={{
              padding: ".65rem .9rem",
              border: "1px solid rgba(255,0,80,.35)",
              background: "rgba(255,0,80,.07)",
              color: "#FF4466",
              fontSize: ".82rem",
              borderRadius: "3px",
              fontFamily: "'Courier New', monospace",
            }}>
              ⚠ {error}
            </div>
          )}

          {verifyHint === "1" && !error && (
            <div style={{
              padding: ".65rem .9rem",
              border: "1px solid rgba(0,245,255,.25)",
              background: "rgba(0,245,255,.06)",
              color: "#00F5FF",
              fontSize: ".82rem",
              borderRadius: "3px",
              fontFamily: "'Courier New', monospace",
            }}>
              ✓ Account created. Verify your email, then log in.
            </div>
          )}

          {resendMessage && !error && (
            <div style={{
              padding: ".65rem .9rem",
              border: "1px solid rgba(0,255,136,.25)",
              background: "rgba(0,255,136,.06)",
              color: "#00FF88",
              fontSize: ".82rem",
              borderRadius: "3px",
              fontFamily: "'Courier New', monospace",
            }}>
              ✓ {resendMessage}
            </div>
          )}

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
            <label htmlFor="email" style={{ fontSize: ".78rem", letterSpacing: ".06em", color: "#aaaaaa", fontFamily: "'Bebas Neue', 'Arial Black', cursive" }}>
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: ".65rem .9rem",
                fontSize: ".9rem",
                background: "#0d0d0d",
                border: "1px solid #2a2a2a",
                borderRadius: "3px",
                color: "#ffffff",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "'Courier New', monospace",
                transition: "border-color .2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#FF6B00")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
            <label htmlFor="password" style={{ fontSize: ".78rem", letterSpacing: ".06em", color: "#aaaaaa", fontFamily: "'Bebas Neue', 'Arial Black', cursive" }}>
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: ".65rem .9rem",
                fontSize: ".9rem",
                background: "#0d0d0d",
                border: "1px solid #2a2a2a",
                borderRadius: "3px",
                color: "#ffffff",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "'Courier New', monospace",
                transition: "border-color .2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#FF6B00")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".65rem", marginTop: ".25rem" }}>
            <button
              type="submit"
              disabled={isPending}
              style={{
                width: "100%",
                fontSize: "1.1rem",
                padding: ".7rem",
                background: isPending ? "#cc5500" : "#FF6B00",
                color: "#000000",
                border: "none",
                borderRadius: "3px",
                fontFamily: "'Bebas Neue', 'Arial Black', cursive",
                letterSpacing: ".1em",
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.6 : 1,
                boxShadow: isPending ? "none" : "0 0 20px rgba(255, 107, 0, 0.35)",
                transition: "all .2s",
              }}
            >
              {isPending ? "AUTHENTICATING..." : "SIGN IN →"}
            </button>

            {canResendVerification && (
              <button
                type="button"
                disabled={resendLoading}
                onClick={handleResendVerification}
                style={{
                  width: "100%",
                  fontSize: ".85rem",
                  padding: ".65rem",
                  background: "transparent",
                  color: "#FF6B00",
                  border: "1px solid #FF6B00",
                  borderRadius: "3px",
                  fontFamily: "'Bebas Neue', 'Arial Black', cursive",
                  letterSpacing: ".08em",
                  cursor: resendLoading ? "not-allowed" : "pointer",
                  opacity: resendLoading ? 0.6 : 1,
                  transition: "all .2s",
                }}
              >
                {resendLoading ? "SENDING..." : "RESEND VERIFICATION EMAIL"}
              </button>
            )}
          </div>

          {/* Footer link */}
          <p style={{ textAlign: "center", fontSize: ".82rem", color: "#888888", marginTop: ".25rem" }}>
            New to HustleClub?{" "}
            <Link href="/signup" style={{ color: "#FF6B00", textDecoration: "none", fontWeight: 600 }}>
              Create account →
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
