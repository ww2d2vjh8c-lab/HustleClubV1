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
      { href: "/my-courses", label: "My Courses" },
      { href: "/my-jobs", label: "My Jobs" },
      { href: "/marketplace/orders", label: "Orders" },
      { href: "/notifications", label: "Alerts" },
      ...(role === "user" ? [{ href: "/creator/apply", label: "Go Creator" }] : []),
      ...(isCreator ? [{ href: "/creator/dashboard", label: "Studio" }] : []),
      ...(role === "admin" ? [{ href: "/admin/dashboard", label: "Admin" }] : []),
    ];
  }, [isCreator, role, user]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    padding: ".35rem .75rem",
    fontFamily: "var(--font-display), cursive",
    fontSize: ".85rem",
    letterSpacing: ".08em",
    borderRadius: "4px",
    border: "1px solid " + (active ? "var(--line-orange)" : "transparent"),
    color: active ? "var(--neon-orange)" : "var(--text-1)",
    background: active ? "rgba(255,102,0,.08)" : "transparent",
    textDecoration: "none",
    transition: "all 150ms ease",
    whiteSpace: "nowrap" as const,
  });

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      borderBottom: "1px solid var(--line)",
      background: "rgba(7,7,15,0.95)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}>
      <div className="app-container">
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: ".7rem 0",
        }}>
          {/* Logo */}
          <Link href="/" onClick={() => setOpen(false)} style={{
            display: "flex", alignItems: "center", gap: ".55rem", textDecoration: "none", flexShrink: 0,
          }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "2rem", height: "2rem",
              background: "var(--neon-orange)",
              color: "#000",
              fontFamily: "var(--font-display), cursive",
              fontSize: "1.1rem", fontWeight: 900,
              borderRadius: "4px",
              boxShadow: "var(--glow-orange-sm)",
              flexShrink: 0,
            }}>H</span>
            <span style={{
              fontFamily: "var(--font-display), cursive",
              fontSize: "1.2rem", letterSpacing: ".1em",
              color: "var(--text-0)",
            }}>
              HUSTLE<span style={{ color: "var(--neon-orange)" }}>CLUB</span>
            </span>
          </Link>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Desktop primary nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: ".2rem" }} className="desktop-nav-primary">
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href} style={navLinkStyle(isActive(link.href))} className="nav-pill">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop user nav (secondary, smaller) */}
          {user && userLinks.length > 0 && (
            <nav style={{ display: "flex", alignItems: "center", gap: ".2rem", paddingLeft: ".5rem", borderLeft: "1px solid var(--line)" }} className="desktop-nav-secondary">
              {userLinks.slice(0, 4).map((link) => {
                const isSpec = ["Admin", "Studio", "Go Creator"].includes(link.label);
                const specColor = link.label === "Admin" ? "var(--neon-pink)" : link.label === "Studio" ? "var(--neon-cyan)" : "var(--neon-green)";
                const active = isActive(link.href);
                return (
                  <Link key={link.href} href={link.href} className="nav-pill" style={{
                    ...navLinkStyle(active),
                    color: active ? "var(--neon-orange)" : isSpec ? specColor : "var(--text-2)",
                    fontSize: ".78rem",
                  }}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Auth / UserMenu */}
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexShrink: 0, paddingLeft: ".5rem" }} className="desktop-auth">
            {user ? (
              <UserMenu avatarUrl={avatarUrl ?? null} initials={initials ?? "U"} />
            ) : (
              <>
                <Link href="/login" className="btn-ghost btn-sm">LOGIN</Link>
                <Link href="/signup" className="btn-neon-solid btn-sm">JOIN NOW</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="mobile-menu-btn"
            style={{
              display: "none",
              padding: ".4rem .7rem",
              border: "1px solid var(--line)",
              background: "transparent",
              color: "var(--text-1)",
              borderRadius: "4px",
              fontSize: ".75rem",
              fontFamily: "var(--font-mono), monospace",
              letterSpacing: ".05em",
              flexShrink: 0,
              cursor: "pointer",
            }}
            aria-expanded={open}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div style={{
            borderTop: "1px solid var(--line)",
            paddingTop: ".75rem",
            paddingBottom: ".75rem",
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginBottom: ".75rem" }}>
              {[...primaryLinks, ...userLinks].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  style={{
                    ...navLinkStyle(isActive(link.href)),
                    border: "1px solid var(--line)",
                    color: isActive(link.href) ? "var(--neon-orange)" : "var(--text-1)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {!user && (
              <div style={{ display: "flex", gap: ".5rem" }}>
                <Link href="/login" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>LOGIN</Link>
                <Link href="/signup" className="btn-neon-solid btn-sm" onClick={() => setOpen(false)}>JOIN NOW</Link>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .nav-pill:hover {
          color: var(--text-0) !important;
          border-color: var(--line) !important;
        }
        @media (max-width: 768px) {
          .desktop-nav-primary, .desktop-nav-secondary, .desktop-auth { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
}
