import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LogRow = {
  id: string;
  action: string;
  target_type: string;
  created_at: string;
  metadata: any;
  actor: {
    username: string | null;
    full_name: string | null;
  } | null;
};

export default async function AuditLogsPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("audit_logs")
    .select(`
      id,
      action,
      target_type,
      created_at,
      metadata,
      actor:profiles (
        username,
        full_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<LogRow[]>();

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Failed to load audit logs
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>

      <div className="overflow-auto border rounded-lg bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Actor</th>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Target</th>
              <th className="px-4 py-2 text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-2">
                  {log.actor?.full_name ||
                    log.actor?.username ||
                    "System"}
                </td>
                <td className="px-4 py-2 font-medium">
                  {log.action.replace("_", " ")}
                </td>
                <td className="px-4 py-2">
                  {log.target_type}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
