import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AuditLog = {
  id: string;
  action: string;
  metadata: any;
  created_at: string;
  actor: {
    username: string | null;
    full_name: string | null;
  } | null;
};

export default async function AdminAuditLogsPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      `
        id,
        action,
        metadata,
        created_at,
        actor:profiles (
          username,
          full_name
        )
      `
    )
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<AuditLog[]>();

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Failed to load audit logs
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-gray-600">
          System actions performed by admins & automation
        </p>
      </header>

      {(!data || data.length === 0) && (
        <p className="text-gray-500">
          No audit logs found.
        </p>
      )}

      <div className="overflow-auto border rounded-lg bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Actor</th>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Metadata</th>
            </tr>
          </thead>

          <tbody>
            {data?.map((log) => (
              <tr key={log.id} className="border-t align-top">
                {/* ACTOR */}
                <td className="px-4 py-2">
                  <div className="font-medium">
                    {log.actor?.full_name ||
                      log.actor?.username ||
                      "System"}
                  </div>
                </td>

                {/* ACTION */}
                <td className="px-4 py-2 font-mono text-xs">
                  {log.action}
                </td>

                {/* TIME */}
                <td className="px-4 py-2 text-xs text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </td>

                {/* METADATA */}
                <td className="px-4 py-2 text-xs text-gray-600">
                  {log.metadata ? (
                    <pre className="max-w-md overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
