import { requireCreator } from "@/lib/supabase/requireCreator";
import { redirect } from "next/navigation";

export default async function NewJobPage() {
  const { supabase, user } = await requireCreator();

  async function createJob(formData: FormData) {
    "use server";

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const budget = Number(formData.get("budget"));
    const type = formData.get("type") as string;

    const { error } = await supabase.from("jobs").insert({
      title,
      description,
      budget,
      type,
      created_by: user.id,
    });

    if (!error) {
      redirect("/creator/dashboard");
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-6">Post a Job</h1>

      <form action={createJob} className="space-y-4">
        <input
          name="title"
          required
          placeholder="Job title"
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          name="description"
          required
          placeholder="Job description"
          className="w-full border px-3 py-2 rounded"
        />

        <input
          name="budget"
          type="number"
          required
          placeholder="Budget (₹)"
          className="w-full border px-3 py-2 rounded"
        />

        <select
          name="type"
          className="w-full border px-3 py-2 rounded"
        >
          <option value="short-form">Short Form</option>
          <option value="clipping">Clipping</option>
          <option value="ugc">UGC</option>
        </select>

        <button className="bg-black text-white px-4 py-2 rounded">
          Create Job
        </button>
      </form>
    </main>
  );
}