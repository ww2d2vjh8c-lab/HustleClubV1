import { requireCreator } from "@/lib/supabase/requireCreator";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type JobRow = {
  id: number;
  title: string;
  description: string | null;
  budget: number | null;
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
  const description = formData.get("description") as string;
  const budget = Number(formData.get("budget"));

  if (!title.trim() || !description.trim()) {
    throw new Error("Title and description are required");
  }

  const { error } = await supabase
    .from("jobs")
    .update({
      title,
      description,
      budget,
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
    .select("id, title, description, budget, is_open")
    .eq("id", jobId)
    .eq("creator_id", user.id)
    .single<JobRow>();

  if (!job) notFound();

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
          <label className="block text-sm mb-2">Description</label>
          <textarea
            name="description"
            defaultValue={job.description ?? ""}
            rows={4}
            className="w-full border px-4 py-2 rounded-md"
          />
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
