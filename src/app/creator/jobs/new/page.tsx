import { redirect } from "next/navigation";
import { requireCreator } from "@/lib/supabase/requireCreator";
import { buildJobDescription, textareaToList } from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  await requireCreator();

  async function createJob(formData: FormData) {
    "use server";

    const { user, supabase } = await requireCreator();

    const title = formData.get("title") as string;
    const overview = formData.get("overview") as string;
    const budget = Number(formData.get("budget"));
    const type = formData.get("type") as string;
    const responsibilities = textareaToList(String(formData.get("responsibilities") ?? ""));
    const requirements = textareaToList(String(formData.get("requirements") ?? ""));
    const deliverables = textareaToList(String(formData.get("deliverables") ?? ""));
    const timeline = String(formData.get("timeline") ?? "");
    const idealCandidate = String(formData.get("idealCandidate") ?? "");

    if (!title.trim() || !overview.trim()) {
      throw new Error("Title and overview are required");
    }

    const description = buildJobDescription({
      overview,
      responsibilities,
      requirements,
      deliverables,
      timeline,
      idealCandidate,
    });

    const { error } = await supabase.from("jobs").insert({
      creator_id: user.id,
      created_by: user.id,
      title,
      description,
      budget: Number.isNaN(budget) ? 0 : budget,
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
            Job Overview
          </label>
          <textarea
            name="overview"
            required
            rows={4}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Explain what this job is about and what success looks like..."
          />
        </div>

        <textarea
          name="responsibilities"
          rows={4}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Responsibilities (one point per line)"
        />

        <textarea
          name="requirements"
          rows={4}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Requirements/skills (one point per line)"
        />

        <textarea
          name="deliverables"
          rows={3}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Expected deliverables (one point per line)"
        />

        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="timeline"
            placeholder="Timeline (e.g. 7 days, ongoing)"
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            name="idealCandidate"
            placeholder="Ideal candidate profile"
            className="w-full border rounded-lg px-3 py-2"
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
