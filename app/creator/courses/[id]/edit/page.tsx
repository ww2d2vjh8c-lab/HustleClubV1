import { requireCreator } from "@/lib/supabase/requireCreator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/* ===== SERVER ACTION ===== */

async function togglePublish(formData: FormData) {
  "use server";

  const courseId = Number(formData.get("courseId"));
  const currentStatus = formData.get("currentStatus") as string;

  const supabase = await createSupabaseServerClient();

  const newStatus =
    currentStatus === "published" ? "draft" : "published";

  const { error } = await supabase
    .from("courses")
    .update({ status: newStatus })
    .eq("id", courseId);

  if (error) {
    console.log("PUBLISH TOGGLE ERROR:", error);
    throw new Error("Failed to update course status");
  }

  redirect(`/creator/courses/${courseId}/edit`);
}

/* ===== PAGE ===== */

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { user, supabase } = await requireCreator();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, status, created_at")
    .eq("id", Number(id))
    .eq("creator_id", user.id)
    .single();

  if (!course) {
    redirect("/creator/courses");
  }

  const isPublished = course.status === "published";

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Manage Course
      </h1>

      <div className="border rounded-lg p-5 bg-white space-y-3">
        <h2 className="text-lg font-semibold">
          {course.title}
        </h2>

        <p className="text-sm text-gray-500">
          Created on{" "}
          {new Date(course.created_at).toLocaleDateString()}
        </p>

        <p className="text-sm text-gray-600">
          {course.description}
        </p>

        <div className="pt-4">
          <p className="text-sm mb-2">
            Current Status:{" "}
            <span
              className={
                isPublished
                  ? "text-green-600"
                  : "text-yellow-600"
              }
            >
              {course.status}
            </span>
          </p>

          <form action={togglePublish}>
            <input
              type="hidden"
              name="courseId"
              value={course.id}
            />
            <input
              type="hidden"
              name="currentStatus"
              value={course.status}
            />

            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-white ${
                isPublished
                  ? "bg-gray-700"
                  : "bg-green-600"
              }`}
            >
              {isPublished ? "Unpublish" : "Publish"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}