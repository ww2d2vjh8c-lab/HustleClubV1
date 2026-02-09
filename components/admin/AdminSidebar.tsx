import Link from "next/link";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/marketplace", label: "Marketplace" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/creator-requests", label: "Creator Requests" },
  { href: "/", label: "← Back to site" },
];

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      <div className="h-16 flex items-center px-6 font-bold text-lg border-b">
        Admin Panel
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
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
