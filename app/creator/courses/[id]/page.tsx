import { requireCreator } from "@/lib/supabase/requireCreator";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import {
  buildCourseDescription,
  listToTextarea,
  parseCourseDescription,
  textareaToList,
} from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

type CourseUpdatePayload = {
  title: string;
  description: string;
  instructor: string;
  price: number;
  image_url?: string;
};

/* ================= SERVER ACTIONS ================= */

async function updateCourse(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();

  const id = Number(formData.get("id"));
  const title = formData.get("title") as string;
  const instructor = formData.get("instructor") as string;
  const price = Number(formData.get("price"));
  const file = formData.get("image") as File;
  const summary = formData.get("summary") as string;
  const whatYouWillLearn = textareaToList(String(formData.get("whatYouWillLearn") ?? ""));
  const whoIsThisFor = textareaToList(String(formData.get("whoIsThisFor") ?? ""));
  const requirements = textareaToList(String(formData.get("requirements") ?? ""));
  const curriculum = textareaToList(String(formData.get("curriculum") ?? ""));

  if (!id || !title || !summary.trim()) {
    throw new Error("Invalid data");
  }

  let imageUrl: string | undefined;

  // 🔹 Upload new image if provided
  if (file && file.size > 0) {
    const fileName = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("courses")
      .upload(fileName, file);

    if (uploadError) {
      console.log("UPLOAD ERROR:", uploadError);
      throw new Error("Image upload failed");
    }

    const { data } = supabase.storage
      .from("courses")
      .getPublicUrl(fileName);

    imageUrl = data.publicUrl;
  }

  const updatePayload: CourseUpdatePayload = {
    title,
    description: buildCourseDescription({
      summary,
      whatYouWillLearn,
      whoIsThisFor,
      requirements,
      curriculum,
    }),
    instructor,
    price: Number.isNaN(price) ? 0 : price,
  };

  if (imageUrl) {
    updatePayload.image_url = imageUrl;
  }

  const { error } = await supabase
    .from("courses")
    .update(updatePayload)
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) {
    console.log("UPDATE ERROR:", error);
    throw new Error("Failed to update course");
  }

  redirect(`/creator/courses/${id}`);
}

async function publishCourse(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();
  const id = Number(formData.get("id"));

  await supabase
    .from("courses")
    .update({ status: "published" })
    .eq("id", id)
    .eq("creator_id", user.id);

  redirect(`/creator/courses/${id}`);
}

async function unpublishCourse(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();
  const id = Number(formData.get("id"));

  await supabase
    .from("courses")
    .update({ status: "draft" })
    .eq("id", id)
    .eq("creator_id", user.id);

  redirect(`/creator/courses/${id}`);
}

async function deleteCourse(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();
  const id = Number(formData.get("id"));

  await supabase
    .from("courses")
    .delete()
    .eq("id", id)
    .eq("creator_id", user.id);

  redirect("/creator/courses");
}

/* ================= PAGE ================= */

export default async function ManageCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { user, supabase } = await requireCreator();

  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", Number(id))
    .eq("creator_id", user.id)
    .single();

  if (error || !course) {
    notFound();
  }

  const isPublished = course.status === "published";
  const parsed = parseCourseDescription(course.description);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-10">
      {/* HEADER */}
      <header>
        <h1 className="text-2xl font-bold">Manage Course</h1>
        <p className="text-sm text-gray-600">{course.title}</p>
      </header>

      {/* EDIT FORM */}
      <form
        action={updateCourse}
        className="border rounded-xl p-6 bg-white space-y-6"
      >
        <input type="hidden" name="id" value={course.id} />

        {/* IMAGE PREVIEW */}
        {course.image_url && (
          <div className="relative h-64 rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={course.image_url}
              alt={course.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div>
          <label className="block text-sm mb-2">Title</label>
          <input
            name="title"
            defaultValue={course.title}
            className="w-full border rounded-md px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Instructor</label>
          <input
            name="instructor"
            defaultValue={course.instructor ?? ""}
            className="w-full border rounded-md px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Price (₹)</label>
          <input
            name="price"
            type="number"
            defaultValue={course.price ?? 0}
            className="w-full border rounded-md px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Course Summary</label>
          <textarea
            name="summary"
            rows={3}
            defaultValue={parsed.summary}
            className="w-full border rounded-md px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">What Learners Will Achieve</label>
          <textarea
            name="whatYouWillLearn"
            rows={4}
            defaultValue={listToTextarea(parsed.whatYouWillLearn)}
            className="w-full border rounded-md px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Who Is This For</label>
          <textarea
            name="whoIsThisFor"
            rows={3}
            defaultValue={listToTextarea(parsed.whoIsThisFor)}
            className="w-full border rounded-md px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Requirements</label>
          <textarea
            name="requirements"
            rows={3}
            defaultValue={listToTextarea(parsed.requirements)}
            className="w-full border rounded-md px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Curriculum Outline</label>
          <textarea
            name="curriculum"
            rows={4}
            defaultValue={listToTextarea(parsed.curriculum)}
            className="w-full border rounded-md px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">
            Replace Image (optional)
          </label>
          <input type="file" name="image" accept="image/*" />
        </div>

        <button className="px-6 py-2 bg-black text-white rounded-md">
          Save Changes
        </button>
      </form>

      {/* STATUS */}
      <div className="text-sm font-medium">
        Status:{" "}
        <span
          className={
            isPublished ? "text-green-600" : "text-gray-500"
          }
        >
          {isPublished ? "Published" : "Draft"}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap gap-3">
        {!isPublished && (
          <form action={publishCourse}>
            <input type="hidden" name="id" value={course.id} />
            <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm">
              Publish
            </button>
          </form>
        )}

        {isPublished && (
          <form action={unpublishCourse}>
            <input type="hidden" name="id" value={course.id} />
            <button className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm">
              Unpublish
            </button>
          </form>
        )}

        <form action={deleteCourse}>
          <input type="hidden" name="id" value={course.id} />
          <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm">
            Delete
          </button>
        </form>
      </div>
    </main>
  );
}
