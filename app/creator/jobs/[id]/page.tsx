import { requireCreator } from "@/lib/supabase/requireCreator";
import { redirect, notFound } from "next/navigation";
import {
  buildJobDescription,
  listToTextarea,
  parseJobDescription,
  textareaToList,
} from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

type JobRow = {
  id: number;
  title: string;
  description: string | null;
  budget: number | null;
  type: string | null;
  is_open: boolean;
};

function getJobId(formData: FormData) {
  const id = Number(formData.get("id"));
  if (Number.isNaN(id)) {
    throw new Error("Invalid job id");
  }

  return id;
}

/* ================= SERVER ACTIONS ================= */

async function updateJob(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();

  const id = getJobId(formData);
  const title = formData.get("title") as string;
  const overview = formData.get("overview") as string;
  const budget = Number(formData.get("budget"));
  const type = String(formData.get("type") ?? "");
  const responsibilities = textareaToList(String(formData.get("responsibilities") ?? ""));
  const requirements = textareaToList(String(formData.get("requirements") ?? ""));
  const deliverables = textareaToList(String(formData.get("deliverables") ?? ""));
  const timeline = String(formData.get("timeline") ?? "");
  const idealCandidate = String(formData.get("idealCandidate") ?? "");

  if (!title.trim() || !overview.trim()) {
    throw new Error("Title and overview are required");
  }

  const { error } = await supabase
    .from("jobs")
    .update({
      title,
      description: buildJobDescription({
        overview,
        responsibilities,
        requirements,
        deliverables,
        timeline,
        idealCandidate,
      }),
      budget: Number.isNaN(budget) ? 0 : budget,
      type,
    })
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) {
    throw new Error("Failed to update job");
  }

  redirect(`/creator/jobs/${id}`);
}

async function toggleJob(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();
  const id = getJobId(formData);
  const isOpen = formData.get("is_open") === "true";

  const { error } = await supabase
    .from("jobs")
    .update({ is_open: !isOpen })
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) {
    throw new Error("Failed to update job status");
  }

  redirect(`/creator/jobs/${id}`);
}

async function deleteJob(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();
  const id = getJobId(formData);

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) {
    throw new Error("Failed to delete job");
  }

  redirect("/creator/dashboard");
}

/* ================= PAGE ================= */

export default async function ManageJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobId = Number(id);

  if (Number.isNaN(jobId)) {
    notFound();
  }

  const { user, supabase } = await requireCreator();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, description, budget, type, is_open")
    .eq("id", jobId)
    .eq("creator_id", user.id)
    .single<JobRow>();

  if (!job) notFound();
  const parsed = parseJobDescription(job.description);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-10">

      <h1 className="text-2xl font-bold">
        Manage Job
      </h1>

      {/* EDIT FORM */}
      <form action={updateJob} className="space-y-6 border p-6 rounded-xl bg-white">
        <input type="hidden" name="id" value={job.id} />

        <div>
          <label className="block text-sm mb-2">Title</label>
          <input
            name="title"
            defaultValue={job.title}
            className="w-full border px-4 py-2 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Job Overview</label>
          <textarea
            name="overview"
            defaultValue={parsed.overview}
            rows={4}
            className="w-full border px-4 py-2 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Responsibilities</label>
          <textarea
            name="responsibilities"
            defaultValue={listToTextarea(parsed.responsibilities)}
            rows={4}
            className="w-full border px-4 py-2 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Requirements</label>
          <textarea
            name="requirements"
            defaultValue={listToTextarea(parsed.requirements)}
            rows={4}
            className="w-full border px-4 py-2 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Deliverables</label>
          <textarea
            name="deliverables"
            defaultValue={listToTextarea(parsed.deliverables)}
            rows={3}
            className="w-full border px-4 py-2 rounded-md"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Timeline</label>
            <input
              name="timeline"
              defaultValue={parsed.timeline}
              className="w-full border px-4 py-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Ideal Candidate</label>
            <input
              name="idealCandidate"
              defaultValue={parsed.idealCandidate}
              className="w-full border px-4 py-2 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2">Job Type</label>
          <select
            name="type"
            defaultValue={job.type ?? "ugc"}
            className="w-full border px-4 py-2 rounded-md"
          >
            <option value="ugc">UGC</option>
            <option value="clipping">Clipping</option>
            <option value="editing">Editing</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-2">Budget</label>
          <input
            name="budget"
            type="number"
            defaultValue={job.budget ?? 0}
            className="w-full border px-4 py-2 rounded-md"
          />
        </div>

        <button className="px-6 py-2 bg-black text-white rounded-md">
          Save Changes
        </button>
      </form>

      {/* STATUS */}
      <div className="space-y-4">

        <form action={toggleJob}>
          <input type="hidden" name="id" value={job.id} />
          <input
            type="hidden"
            name="is_open"
            value={job.is_open ? "true" : "false"}
          />

          <button className="px-4 py-2 bg-yellow-500 text-white rounded-md">
            {job.is_open ? "Close Job" : "Reopen Job"}
          </button>
        </form>

        <form action={deleteJob}>
          <input type="hidden" name="id" value={job.id} />
          <button className="px-4 py-2 bg-red-600 text-white rounded-md">
            Delete Job
          </button>
        </form>

      </div>

    </main>
  );
}
