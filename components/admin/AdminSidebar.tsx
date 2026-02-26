import Link from "next/link";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin", label: "Users" },
  { href: "/admin/analytics", label: "Platform Analytics" },
  { href: "/admin/creator-analytics", label: "Creator Analytics" },
  { href: "/admin/creator-requests", label: "Creator Requests" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/jobs/applicants", label: "Applicants" },
  { href: "/admin/marketplace", label: "Marketplace" },
  { href: "/admin/marketplace/orders", label: "Marketplace Orders" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
  { href: "/", label: "← Back to site" },
];

export default function AdminSidebar() {
  return (
    <aside className="w-full md:w-64 bg-white border-r flex flex-col md:min-h-screen">
      <div className="h-16 flex items-center px-6 font-bold text-lg border-b">
        Admin Panel
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 grid md:block grid-cols-2 gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
