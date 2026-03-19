import { requireAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { supabase } = await requireAdmin();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">Failed to load users</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Users</h1>

      {users && users.length === 0 && (
        <p className="text-gray-600">No users found.</p>
      )}

      <div className="overflow-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">Email</th>
              <th className="border px-3 py-2 text-left">Role</th>
              <th className="border px-3 py-2 text-left">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id}>
                <td className="border px-3 py-2">{user.email}</td>
                <td className="border px-3 py-2">{user.role}</td>
                <td className="border px-3 py-2">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
