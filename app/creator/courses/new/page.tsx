import { requireCreator } from "@/lib/supabase/requireCreator";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function createCourse(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!title.trim()) {
    throw new Error("Course title is required");
  }

  const { error } = await supabase.from("courses").insert({
    title,
    description,
    creator_id: user.id,
    status: "draft",
  });

  if (error) {
    console.log("COURSE CREATE ERROR:", error);
    throw new Error("Failed to create course");
  }

  redirect("/creator/courses");
}

export default async function NewCoursePage() {
  await requireCreator();

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Course</h1>

      <form action={createCourse} className="space-y-4">
        <input
          name="title"
          placeholder="Course Title"
          required
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          name="description"
          placeholder="Course Description"
          rows={6}
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
