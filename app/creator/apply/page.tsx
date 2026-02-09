import { requireUser } from "@/lib/auth/requireUser";
import CreatorApplyForm from "@/components/creator/CreatorApplyForm";

export const dynamic = "force-dynamic";

export default async function CreatorApplyPage() {
  const { user, supabase } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "creator" || profile?.role === "admin") {
    return (
      <div className="max-w-xl mx-auto p-6 text-green-600">
        You are already a creator 🎉
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

      <CreatorApplyForm userId={user.id} />
    </main>
  );
}