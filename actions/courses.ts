// actions/courses.ts
"use server";

import { requireCreator } from "../lib/supabase/auth";

export async function createCourse(input: {
  title: string;
  description?: string;
}) {
  const { supabase, user } = await requireCreator();

  const { error } = await supabase.from("courses").insert({
    title: input.title,
    description: input.description ?? null,
    status: "draft",
    creator_id: user.id,
  });

  if (error) throw error;
}

export async function publishCourse(courseId: string) {
  const { supabase, user } = await requireCreator();

  const { error } = await supabase
    .from("courses")
    .update({ status: "published" })
    .eq("id", courseId)
    .eq("creator_id", user.id);

  if (error) throw error;
}