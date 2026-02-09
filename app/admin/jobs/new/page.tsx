import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PostJobPage() {
const { user } = await requireUser();

  async function createJob(formData: FormData) {
    "use server";

    const title = String(formData.get("title"));
    const description = String(formData.get("description"));

    const supabase = await createSupabaseServerClient();

    await supabase.from("jobs").insert({
      title,
      description,
      created_by: user.id,
    });

    redirect("/admin/jobs");
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Post a Job</h1>

      <form action={createJob} className="space-y-4">
        <input
          name="title"
          placeholder="Job title"
          required
          className="w-full border rounded px-3 py-2"
        />

        <textarea
          name="description"
          placeholder="Job description"
          rows={5}
          required
          className="w-full border rounded px-3 py-2"
        />

        <button className="w-full bg-black text-white py-2 rounded">
          Publish Job
        </button>
      </form>
    </main>
  );
}
