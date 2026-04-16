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

  const links = useMemo(() => {
    const base = [
      { href: "/courses", label: "Courses" },
      { href: "/jobs", label: "Jobs" },
      { href: "/marketplace", label: "Marketplace" },
    ];

    if (!user) return base;

    return [
      ...base,
      { href: "/dashboard", label: "Dashboard" },
      { href: "/notifications", label: "Notifications" },
      { href: "/my-courses", label: "My Courses" },
      { href: "/my-jobs", label: "My Jobs" },
      { href: "/marketplace/orders", label: "Orders" },
      ...(role === "user" ? [{ href: "/creator/apply", label: "Become a Creator" }] : []),
      ...(isCreator ? [{ href: "/creator/dashboard", label: "Creator Dashboard" }] : []),
      ...(role === "admin" ? [{ href: "/admin/dashboard", label: "Admin" }] : []),
    ];
  }, [isCreator, role, user]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-lg">
      <div className="app-container py-3">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-lg font-semibold font-[var(--font-display)]"
            onClick={() => setOpen(false)}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              H
            </span>
            HustleClub
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="md:hidden rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>

        <div className={`${open ? "mt-4 grid gap-4" : "hidden"} md:mt-3 md:flex md:items-center md:justify-between md:gap-4 md:flex`}>
          <nav className="flex flex-wrap gap-2 text-sm items-center">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(`${link.href}/`));
              const badge =
                link.label === "Admin"
                  ? "text-red-700"
                  : link.label === "Creator Dashboard" || link.label === "Become a Creator"
                    ? "text-emerald-700"
                    : "";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-full px-3 py-1.5 border transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  } ${badge}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex gap-2 text-sm items-center">
            {user ? (
              <UserMenu
                avatarUrl={avatarUrl ?? null}
                initials={initials ?? "U"}
              />
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-full px-3 py-1.5 border border-slate-200 hover:bg-slate-50">
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
