import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Course = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
};

export default async function LearnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  // 🔐 1️⃣ Require login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 🔐 2️⃣ Verify enrollment
  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("course_id", Number(id))
    .eq("user_id", user.id)
    .single();

  if (!enrollment) {
    // Not enrolled → redirect to public page
    redirect(`/courses/${id}`);
  }

  // 📘 3️⃣ Fetch course content
  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      image_url
    `)
    .eq("id", Number(id))
    .single<Course>();

  if (error || !course) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">
          {course.title}
        </h1>
        <p className="text-green-600 text-sm mt-2">
          You are enrolled in this course
        </p>
      </header>

      {course.image_url && (
        <div className="w-full h-64 bg-gray-100 rounded-xl overflow-hidden">
          <img
            src={course.image_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="text-gray-700 leading-relaxed">
        {course.description}
      </div>

      {/* Placeholder for lessons */}
      <div className="pt-8 border-t">
        <h2 className="text-xl font-semibold mb-4">
          Course Content
        </h2>

        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            Lesson 1 — Introduction
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            Lesson 2 — Core Concepts
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            Lesson 3 — Advanced Strategies
          </div>
        </div>
      </div>
    </main>
  );
}