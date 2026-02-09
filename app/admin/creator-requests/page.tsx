import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CreatorRequestActions from "@/components/admin/CreatorRequestActions";

export const dynamic = "force-dynamic";

type Status = "pending" | "approved" | "rejected";

type RequestRow = {
  id: string;
  message: string | null;
  created_at: string;
  status: Status;
  user: {
    id: string;
    username: string | null;
    full_name: string | null;
  } | null;
};

export default async function CreatorRequestsPage({
  searchParams,
}: {
  searchParams: { status?: Status };
}) {
  const user = await requireUser("/admin/creator-requests");
  const supabase = await createSupabaseServerClient();

  /* ───────── ADMIN GUARD ───────── */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto p-6 text-red-500">
        Admin access only.
      </div>
    );
  }

  /* ───────── FILTER ───────── */
  const status: Status = searchParams?.status ?? "pending";

  /* ───────── FETCH REQUESTS ───────── */
  const { data, error } = await supabase
    .from("creator_requests")
    .select(
      `
        id,
        message,
        created_at,
        status,
        user:profiles (
          id,
          username,
          full_name
        )
      `
    )
    .eq("status", status)
    .order("created_at", { ascending: false })
    .returns<RequestRow[]>();

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6 text-red-500">
        Failed to load creator requests.
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <header className="space-y-3">
        <h1 className="text-2xl font-bold">Creator Requests</h1>

        {/* FILTER TABS */}
        <div className="flex gap-2 text-sm">
          {(["pending", "approved", "rejected"] as Status[]).map((s) => (
            <a
              key={s}
              href={`/admin/creator-requests?status=${s}`}
              className={`px-3 py-1 rounded border ${
                status === s
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {s}
            </a>
          ))}
        </div>
      </header>

      {/* EMPTY STATE */}
      {(!data || data.length === 0) && (
        <p className="text-gray-500">No {status} requests.</p>
      )}

      {/* BULK ACTIONS */}
      {data && data.length > 0 && (
        <CreatorRequestActions
          requests={data.map((r) => ({
            id: r.id,
            status: r.status,
          }))}
        />
      )}

      {/* REQUEST LIST */}
      <section className="space-y-4">
        {data?.map((r) => (
          <div
            key={r.id}
            className="border rounded-xl p-5 bg-white space-y-2"
          >
            <p className="font-medium">
              {r.user?.full_name ||
                r.user?.username ||
                "Unknown user"}
            </p>

            {r.message && (
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {r.message}
              </p>
            )}

            <p className="text-xs text-gray-400">
              Submitted{" "}
              {new Date(r.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
