"use client";
import { Role } from "@/types";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import UserMenu from "@/components/navigation/UserMenu";

export default function Navbar({
  user,
  role,
  avatarUrl,
  initials,
}: {
  user: User | null;
  role: Role;
  avatarUrl?: string | null;
  initials?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isCreator = role === "creator" || role === "admin";

  const primaryLinks = [
    { href: "/courses", label: "Courses" },
    { href: "/jobs", label: "Jobs" },
    { href: "/marketplace", label: "Market" },
  ];

  const userLinks = useMemo(() => {
    if (!user) return [];
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/notifications", label: "Alerts" },
      { href: "/my-courses", label: "My Courses" },
      { href: "/my-jobs", label: "My Jobs" },
      { href: "/marketplace/orders", label: "Orders" },
      ...(role === "user" ? [{ href: "/creator/apply", label: "Go Creator" }] : []),
      ...(isCreator ? [{ href: "/creator/dashboard", label: "Studio" }] : []),
      ...(role === "admin" ? [{ href: "/admin/dashboard", label: "Admin" }] : []),
    ];
  }, [isCreator, role, user]);

  const allLinks = [...primaryLinks, ...userLinks];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid rgba(255,102,0,0.18)",
        background: "rgba(7,7,15,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="app-container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", gap: "1rem" }}>
          {/* Logo */}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}
          >
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "2.25rem", height: "2.25rem",
              background: "var(--neon-orange)",
              color: "#000", fontWeight: 900,
              fontFamily: "var(--font-display), 'Bebas Neue', cursive",
              fontSize: "1.2rem", letterSpacing: ".05em",
              borderRadius: "3px",
              boxShadow: "var(--glow-orange-sm)",
            }}>H</span>
            <span style={{
              fontFamily: "var(--font-display), 'Bebas Neue', cursive",
              fontSize: "1.35rem", letterSpacing: ".12em",
              color: "var(--text-0)",
            }}>
              HUSTLE<span style={{ color: "var(--neon-orange)", textShadow: "var(--glow-orange-sm)" }}>CLUB</span>
            </span>
          </Link>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            style={{
              display: "none",
              padding: "0.4rem 0.8rem",
              border: "1px solid var(--line)",
              background: "transparent",
              color: "var(--text-1)",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: ".8rem",
              fontFamily: "var(--font-mono), monospace",
              letterSpacing: ".05em",
            }}
            className="md-hidden-toggle"
            aria-expanded={open}
          >
            {open ? "✕ CLOSE" : "☰ MENU"}
          </button>

          {/* Desktop nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: ".25rem", flexWrap: "wrap" }} className="desktop-nav">
            {primaryLinks.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href + "/"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: ".4rem .85rem",
                    fontFamily: "var(--font-display), 'Bebas Neue', cursive",
                    fontSize: ".9rem",
                    letterSpacing: ".1em",
                    borderRadius: "3px",
                    border: active ? "1px solid var(--neon-orange)" : "1px solid transparent",
                    color: active ? "var(--neon-orange)" : "var(--text-1)",
                    textShadow: active ? "var(--glow-orange-sm)" : "none",
                    background: active ? "rgba(255,102,0,.1)" : "transparent",
                    textDecoration: "none",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.target as HTMLElement).style.color = "var(--text-0)";
                      (e.target as HTMLElement).style.borderColor = "var(--line)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.target as HTMLElement).style.color = "var(--text-1)";
                      (e.target as HTMLElement).style.borderColor = "transparent";
                    }
                  }}
                >
                  {link.label}
                </Link>
              );
            })}

            {user && (
              <span style={{ width: "1px", height: "16px", background: "var(--line)", margin: "0 .25rem", display: "inline-block" }} />
            )}

            {userLinks.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href + "/"));
              const isSpecial = link.label === "Admin" || link.label === "Studio" || link.label === "Go Creator";
              const specialColor = link.label === "Admin" ? "var(--neon-pink)" : link.label === "Studio" ? "var(--neon-cyan)" : "var(--neon-green)";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: ".4rem .85rem",
                    fontFamily: "var(--font-display), 'Bebas Neue', cursive",
                    fontSize: ".9rem",
                    letterSpacing: ".1em",
                    borderRadius: "3px",
                    border: active ? `1px solid ${isSpecial ? specialColor : "var(--neon-orange)"}` : "1px solid transparent",
                    color: active ? (isSpecial ? specialColor : "var(--neon-orange)") : (isSpecial ? specialColor : "var(--text-1)"),
                    background: active ? `rgba(255,102,0,.1)` : "transparent",
                    textDecoration: "none",
                    transition: "all 150ms ease",
                    opacity: isSpecial ? 1 : undefined,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }} className="auth-buttons">
            {user ? (
              <UserMenu avatarUrl={avatarUrl ?? null} initials={initials ?? "U"} />
            ) : (
              <>
                <Link href="/login" className="btn-ghost" style={{ padding: ".4rem 1rem", fontSize: ".8rem" }}>
                  LOGIN
                </Link>
                <Link href="/signup" className="btn-neon-solid" style={{ padding: ".4rem 1rem", fontSize: ".85rem" }}>
                  JOIN NOW
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div style={{ paddingBottom: "1rem", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", paddingTop: ".75rem" }}>
              {allLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    style={{
                      padding: ".4rem .9rem",
                      fontFamily: "var(--font-display), cursive",
                      fontSize: ".85rem",
                      letterSpacing: ".08em",
                      borderRadius: "3px",
                      border: "1px solid " + (active ? "var(--neon-orange)" : "var(--line)"),
                      color: active ? "var(--neon-orange)" : "var(--text-1)",
                      background: active ? "rgba(255,102,0,.1)" : "transparent",
                      textDecoration: "none",
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {!user && (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost" style={{ fontSize: ".85rem" }}>LOGIN</Link>
                  <Link href="/signup" onClick={() => setOpen(false)} className="btn-neon-solid" style={{ fontSize: ".85rem" }}>JOIN NOW</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .auth-buttons { display: none !important; }
          .md-hidden-toggle { display: block !important; }
        }
      `}</style>
    </header>
  );
}
