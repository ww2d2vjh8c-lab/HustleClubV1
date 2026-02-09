import { requireAdmin } from "@/lib/supabase/auth";
import ImpersonateButton from "@/components/admin/ImpersonateButton";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  role: "user" | "creator" | "admin";
  created_at: string;
};

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<UserRow[]>();

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Failed to load users
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin · Users</h1>
        <p className="text-sm text-gray-600">
          Manage users and impersonate safely
        </p>
      </header>

      <div className="overflow-auto border rounded-lg bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Joined</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-t">
                {/* USER */}
                <td className="px-4 py-2">
                  <div className="font-medium">
                    {u.full_name || u.username || "Unnamed user"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {u.id}
                  </div>
                </td>

                {/* ROLE */}
                <td className="px-4 py-2 capitalize">
                  {u.role}
                </td>

                {/* CREATED */}
                <td className="px-4 py-2">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>

                {/* ACTIONS */}
                <td className="px-4 py-2">
                  <ImpersonateButton
                    userId={u.id}
                    userRole={u.role}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}