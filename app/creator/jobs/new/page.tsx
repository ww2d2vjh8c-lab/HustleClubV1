import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCreator } from "@/lib/supabase/requireCreator";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const { user } = await requireCreator();
  const supabase = await createSupabaseServerClient();

  async function createJob(formData: FormData) {
    "use server";

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const budget = Number(formData.get("budget"));
    const type = formData.get("type") as string;

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("jobs").insert({
      creator_id: user.id,
      title,
      description,
      budget,
      type,
    });

   if (error) {
  console.log("CREATE JOB ERROR:", error);
  throw new Error(error.message);
}

    redirect("/creator/dashboard");
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Post New Job</h1>

      <form action={createJob} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            Job Title
          </label>
          <input
            name="title"
            required
            className="w-full border rounded-lg px-3 py-2"
            placeholder="UGC Creator for Instagram Reels"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            name="description"
            required
            rows={5}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Explain the job requirements..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Budget (₹)
          </label>
          <input
            name="budget"
            type="number"
            required
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Job Type
          </label>
          <select
            name="type"
            required
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="ugc">UGC</option>
            <option value="clipping">Clipping</option>
            <option value="editing">Editing</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-lg bg-black text-white"
        >
          Create Job
        </button>
      </form>
    </main>
  );
}