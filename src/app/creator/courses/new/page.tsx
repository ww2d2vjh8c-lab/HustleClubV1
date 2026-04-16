import { requireCreator } from "@/lib/supabase/requireCreator";
import { redirect } from "next/navigation";
import { buildCourseDescription, textareaToList } from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

async function createCourse(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();

  const title = formData.get("title") as string;
  const instructor = formData.get("instructor") as string;
  const price = Number(formData.get("price") ?? 0);
  const summary = formData.get("summary") as string;
  const whatYouWillLearn = textareaToList(String(formData.get("whatYouWillLearn") ?? ""));
  const whoIsThisFor = textareaToList(String(formData.get("whoIsThisFor") ?? ""));
  const requirements = textareaToList(String(formData.get("requirements") ?? ""));
  const curriculum = textareaToList(String(formData.get("curriculum") ?? ""));

  if (!title.trim() || !summary.trim()) {
    throw new Error("Course title and summary are required");
  }

  const description = buildCourseDescription({
    summary,
    whatYouWillLearn,
    whoIsThisFor,
    requirements,
    curriculum,
  });

  const { error } = await supabase.from("courses").insert({
    title,
    description,
    instructor,
    price: Number.isNaN(price) ? 0 : price,
    creator_id: user.id,
    status: "draft",
  });

  if (error) {
    throw new Error("Failed to create course");
  }

  redirect("/creator/courses");
}

export default async function NewCoursePage() {
  await requireCreator();

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Create New Course</h1>

      <form action={createCourse} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="title"
            placeholder="Course title"
            required
            className="w-full border px-3 py-2 rounded"
          />

          <input
            name="instructor"
            placeholder="Instructor name"
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            placeholder="Price (0 for free)"
            className="w-full border px-3 py-2 rounded"
          />

          <input
            name="summary"
            placeholder="One-line course summary"
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <textarea
          name="whatYouWillLearn"
          placeholder="What learners will achieve (one point per line)"
          rows={4}
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          name="whoIsThisFor"
          placeholder="Who this course is for (one point per line)"
          rows={3}
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          name="requirements"
          placeholder="Requirements/prerequisites (one point per line)"
          rows={3}
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          name="curriculum"
          placeholder="Curriculum outline (one module per line)"
          rows={4}
          className="w-full border px-3 py-2 rounded"
        />

        <button
          type="submit"
          className="px-4 py-2 bg-black text-white rounded-md"
        >
          Save as Draft
        </button>
      </form>
    </main>
  );
}
