import { requireUser } from "@/lib/auth/requireUser";
import CreatorApplyForm from "@/components/creator/CreatorApplyForm";

export const dynamic = "force-dynamic";

export default async function CreatorApplyPage() {
  const { user, supabase } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, username")
    .eq("id", user.id)
    .single();

  const { data: latestRequest } = await supabase
    .from("creator_requests")
    .select("status, message, reason, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (profile?.role === "creator" || profile?.role === "admin") {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <h1 className="text-3xl font-bold">Creator Access</h1>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-green-700">
          You already have creator access.
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Become a Creator</h1>
        <p className="text-gray-600 mt-2">
          Creators can post jobs, sell items, and publish courses.
        </p>
      </header>

      <section className="rounded-xl border bg-white p-5 space-y-3">
        <h2 className="font-semibold">Your Account</h2>
        <p className="text-sm text-gray-600">
          {profile?.full_name || profile?.username || user.email}
        </p>
      </section>

      {latestRequest?.status === "pending" ? (
        <section className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 space-y-2">
          <h2 className="font-semibold text-yellow-800">Request In Review</h2>
          <p className="text-sm text-yellow-700">
            Submitted on {new Date(latestRequest.created_at).toLocaleDateString()}.
          </p>
          {latestRequest.message && (
            <p className="text-sm text-yellow-700">Message: {latestRequest.message}</p>
          )}
        </section>
      ) : (
        <>
          {latestRequest?.status === "rejected" && (
            <section className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-2">
              <h2 className="font-semibold text-red-800">Previous Request Rejected</h2>
              {latestRequest.reason && (
                <p className="text-sm text-red-700">Reason: {latestRequest.reason}</p>
              )}
              <p className="text-sm text-red-700">
                You can submit a new request with updated details.
              </p>
            </section>
          )}

          <CreatorApplyForm />
        </>
      )}
    </main>
  );
}
