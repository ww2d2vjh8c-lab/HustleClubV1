import { requireAdmin } from "@/lib/auth/requireAdmin";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const { supabase } = await requireAdmin("/admin/courses");

  const { data: courses } = await supabase
    .from("courses")
    .select("id,title,status,created_at");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin · Courses</h1>
      {courses?.map((c) => (
        <p key={c.id}>{c.title}</p>
      ))}
    </div>
  );
}
