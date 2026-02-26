import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LegacyEditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/creator/courses/${id}`);
}
