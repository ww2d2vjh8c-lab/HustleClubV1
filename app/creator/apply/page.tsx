import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CreatorApplyForm from "@/components/creator/CreatorApplyForm";

export const dynamic = "force-dynamic";

export default async function CreatorApplyPage() {
  const user = await requireUser("/creator/apply");
  const supabase = await createSupabaseServerClient();

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

      <section className="space-y-3">
        <h2 className="font-semibold">Requirements</h2>
        <ul className="list-disc list-inside text-sm text-gray-600">
          <li>Complete profile</li>
          <li>Clear description of what you want to build</li>
          <li>Quality over quantity</li>
        </ul>
      </section>

      <CreatorApplyForm userId={user.id} />
    </main>
  );
}
