"use server";

import { requireCreator } from "../lib/supabase/auth";

export async function createJob(input: {
  title: string;
  description: string;
}) {
  const { supabase, user } = await requireCreator();

  const { error } = await supabase.from("jobs").insert({
    title: input.title,
    description: input.description,
    creator_id: user.id,
  });

  if (error) throw error;
}