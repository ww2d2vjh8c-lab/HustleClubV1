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

  const inputStyle: React.CSSProperties = {
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
  };

  const labelStyle: React.CSSProperties = {
    fontSize: ".78rem",
    letterSpacing: ".06em",
    color: "#aaaaaa",
    fontFamily: "'Bebas Neue', 'Arial Black', cursive",
  };

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
          onSubmit={handleSignup}
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
            }}>CREATE ACCOUNT</h1>
            <p style={{ color: "#888888", fontSize: ".85rem", marginTop: ".35rem" }}>
              Get access to courses, jobs, and marketplace in one place.
            </p>
          </div>

          {/* Error message */}
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

          {/* Email verification banner */}
          {needsEmailVerification && (
            <div style={{
              padding: ".75rem .9rem",
              border: "1px solid rgba(0,245,255,.25)",
              background: "rgba(0,245,255,.06)",
              color: "#00F5FF",
              fontSize: ".82rem",
              borderRadius: "3px",
              fontFamily: "'Courier New', monospace",
              display: "flex",
              flexDirection: "column",
              gap: ".5rem",
            }}>
              <p style={{ margin: 0 }}>
                ✓ Account created. Check your email and verify before logging in.
              </p>
              <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#FF6B00",
                    cursor: resendingVerification ? "not-allowed" : "pointer",
                    fontSize: ".82rem",
                    fontFamily: "'Bebas Neue', 'Arial Black', cursive",
                    letterSpacing: ".05em",
                    textDecoration: "underline",
                    padding: 0,
                    opacity: resendingVerification ? 0.5 : 1,
                  }}
                >
                  {resendingVerification ? "SENDING..." : "RESEND VERIFICATION EMAIL"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/login?verify=1")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#FF6B00",
                    cursor: "pointer",
                    fontSize: ".82rem",
                    fontFamily: "'Bebas Neue', 'Arial Black', cursive",
                    letterSpacing: ".05em",
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  GO TO LOGIN →
                </button>
              </div>
              {verificationMessage && (
                <p style={{ margin: 0, color: "#00FF88" }}>✓ {verificationMessage}</p>
              )}
            </div>
          )}

          {/* Full Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
            <label style={labelStyle}>FULL NAME</label>
            <input
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={80}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#FF6B00")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
            />
          </div>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
            <label style={labelStyle}>EMAIL ADDRESS</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#FF6B00")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
            <label style={labelStyle}>PASSWORD</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#FF6B00")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
            />
          </div>

          {/* Confirm Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
            <label style={labelStyle}>CONFIRM PASSWORD</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#FF6B00")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
            />
          </div>

          <p style={{ fontSize: ".78rem", color: "#555555", fontFamily: "'Courier New', monospace", margin: "-.5rem 0 0" }}>
            // Use at least 8 characters with letters and numbers.
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || needsEmailVerification}
            style={{
              width: "100%",
              fontSize: "1.1rem",
              padding: ".7rem",
              background: loading || needsEmailVerification ? "#cc5500" : "#FF6B00",
              color: "#000000",
              border: "none",
              borderRadius: "3px",
              fontFamily: "'Bebas Neue', 'Arial Black', cursive",
              letterSpacing: ".1em",
              cursor: loading || needsEmailVerification ? "not-allowed" : "pointer",
              opacity: loading || needsEmailVerification ? 0.6 : 1,
              boxShadow: loading || needsEmailVerification ? "none" : "0 0 20px rgba(255, 107, 0, 0.35)",
              transition: "all .2s",
              marginTop: ".25rem",
            }}
          >
            {loading ? "CREATING ACCOUNT..." : "JOIN THE HUSTLE →"}
          </button>

          {/* Footer link */}
          <p style={{ textAlign: "center", fontSize: ".82rem", color: "#888888", marginTop: ".25rem" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#FF6B00", textDecoration: "none", fontWeight: 600 }}>
              Login →
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
