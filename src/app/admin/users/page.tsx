import { requireAdmin } from "@/lib/supabase/auth";
import RoleSwitcher from "@/components/admin/RoleSwitcher";
import ImpersonateButton from "@/components/admin/ImpersonateButton";

export const dynamic = "force-dynamic";

type Role = "user" | "creator" | "admin";

type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  role: Role;
  created_at: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { q?: string; role?: Role | "all" };
}) {
  const { user: adminUser, supabase } = await requireAdmin();
  const q = (searchParams?.q ?? "").trim();
  const roleFilter = searchParams?.role ?? "all";

  let query = supabase
    .from("profiles")
    .select("id, email, username, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (roleFilter !== "all") {
    query = query.eq("role", roleFilter);
  }

  if (q) {
    query = query.or(
      `email.ilike.%${q}%,username.ilike.%${q}%,full_name.ilike.%${q}%`
    );
  }

  const { data: users, error } = await query.returns<UserRow[]>();

  if (error) {
    return (
      <main className="app-card rounded-xl p-6">
        <p className="text-red-600">Failed to load users.</p>
      </main>
    );
  }

  const roleCounts = {
    all: users?.length ?? 0,
    user: users?.filter((u) => u.role === "user").length ?? 0,
    creator: users?.filter((u) => u.role === "creator").length ?? 0,
    admin: users?.filter((u) => u.role === "admin").length ?? 0,
  };

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">Users & Roles</h1>
        <p className="text-sm text-slate-600">
          Manage role access, review accounts, and impersonate non-admin users for troubleshooting.
        </p>
      </header>

      <section className="app-card rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Metric label="Visible Users" value={roleCounts.all} />
        <Metric label="Users" value={roleCounts.user} />
        <Metric label="Creators" value={roleCounts.creator} />
        <Metric label="Admins" value={roleCounts.admin} />
      </section>

      <form className="app-card rounded-xl p-4 flex flex-wrap gap-2 items-center" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search email, username, full name"
          className="min-w-[220px] flex-1 px-3 py-2"
        />
        <select name="role" defaultValue={roleFilter} className="px-3 py-2">
          <option value="all">All roles</option>
          <option value="user">User</option>
          <option value="creator">Creator</option>
          <option value="admin">Admin</option>
        </select>
        <button className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800">
          Apply
        </button>
      </form>

      <section className="app-card rounded-xl overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">User</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Joined</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((profile) => {
              const display =
                profile.full_name?.trim() ||
                profile.username?.trim() ||
                profile.email?.trim() ||
                "Unknown";
              const isSelf = profile.id === adminUser.id;
              return (
                <tr key={profile.id} className="border-t border-slate-200 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{display}</p>
                    <p className="text-xs text-slate-500 mt-1">{profile.email ?? "No email"}</p>
                    <p className="text-xs text-slate-400 mt-1">id: {profile.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <RoleSwitcher userId={profile.id} currentRole={profile.role} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(profile.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-xs text-slate-500">Current admin</span>
                    ) : (
                      <ImpersonateButton userId={profile.id} userRole={profile.role} />
                    )}
                  </td>
                </tr>
              );
            })}
            {users?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No users found for this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
