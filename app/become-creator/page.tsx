import { requireUser } from "@/lib/auth/requireUser";
import { requestCreatorAccess } from "./actions";

export const dynamic = "force-dynamic";

export default async function BecomeCreatorPage() {
  const { user, supabase } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "creator") {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold">You’re a Creator 🎉</h1>
      </div>
    );
  }

  const { data: request } = await supabase
    .from("creator_requests")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (request) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Request Submitted</h1>
        <p className="text-gray-600 mt-2">
          Status: <strong>{request.status}</strong>
        </p>
      </div>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Become a Creator</h1>

      <ul className="list-disc pl-5 text-gray-700 space-y-1">
        <li>Post jobs</li>
        <li>Sell on marketplace</li>
        <li>Manage applicants</li>
      </ul>

      <form action={requestCreatorAccess}>
        <button className="w-full px-5 py-3 rounded-lg bg-black text-white">
          Request Creator Access
        </button>
      </form>
    </main>
  );
}