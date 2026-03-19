"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Platform Analytics" },
  { href: "/admin/creator-analytics", label: "Creator Analytics" },
  { href: "/admin/creator-requests", label: "Creator Requests" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/jobs/applicants", label: "Applicants" },
  { href: "/admin/marketplace", label: "Marketplace" },
  { href: "/admin/marketplace/orders", label: "Marketplace Orders" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
  { href: "/", label: "← Back to site" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-72 app-surface md:min-h-screen md:sticky md:top-[76px] md:self-start rounded-b-2xl md:rounded-b-none md:rounded-r-2xl">
      <div className="h-16 flex items-center px-6 font-semibold text-lg font-[var(--font-display)] border-b border-slate-200/70">
        Admin Console
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 grid md:block grid-cols-2 gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`block px-3 py-2 rounded-lg text-sm transition ${
              pathname === l.href || pathname.startsWith(`${l.href}/`)
                ? "bg-slate-900 text-white"
                : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
