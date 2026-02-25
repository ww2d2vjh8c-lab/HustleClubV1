import { requireCreator } from "@/lib/supabase/requireCreator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import ApplicantModal from "@/components/applications/ApplicantModal";

export const dynamic = "force-dynamic";

/* ================= SERVER ACTION ================= */

async function updateStatus(
  applicationId: string,
  newStatus: string,
  jobId: string
) {
  "use server";

  const supabase = await createSupabaseServerClient();

  // 1️⃣ Update selected application
  const { error } = await supabase
    .from("job_applications")
    .update({ status: newStatus })
    .eq("id", applicationId);

  if (error) {
    console.log("STATUS UPDATE ERROR:", error);
    throw new Error("Failed to update status");
  }

  // 2️⃣ If accepted → auto reject others + close job
  if (newStatus === "accepted") {
    // Reject all other pending applications
    await supabase
      .from("job_applications")
      .update({ status: "rejected" })
      .eq("job_id", Number(jobId))
      .neq("id", applicationId)
      .eq("status", "pending");

    // Close the job
    await supabase
      .from("jobs")
      .update({ is_open: false })
      .eq("id", Number(jobId));
  }

  redirect(`/creator/jobs/${jobId}/applications`);
}

/* ================= PAGE ================= */

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { user, supabase } = await requireCreator();

  /* Verify job ownership */
  type Job = {
  id: number;
  title: string;
  is_open: boolean;
};

const { data: job } = await supabase
  .from("jobs")
  .select("id, title, is_open")
  .eq("id", Number(id))
  .eq("creator_id", user.id)
  .single<Job>();

  if (!job) {
    redirect("/creator/dashboard");
  }

  /* Fetch applications */
  const { data: applications, error } = await supabase
    .from("job_applications")
    .select(`
      id,
      status,
      created_at,
      applicant:profiles!job_applications_applicant_id_fkey (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq("job_id", Number(id))
    .order("created_at", { ascending: false });

  if (error) {
    console.log("APPLICATION LOAD ERROR:", error);
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load applications.
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Applications for: {job.title}
      </h1>

      {!applications || applications.length === 0 ? (
        <p className="text-gray-500">No applications yet.</p>
      ) : (
        <section className="space-y-4">
          {applications.map((app: any) => {
            const statusStyles =
              app.status === "accepted"
                ? "bg-green-100 text-green-700"
                : app.status === "rejected"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700";

            return (
              <div
                key={app.id}
                className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition"
              >
                {/* PROFILE HEADER */}
                <ApplicantModal applicant={app.applicant}>
                  <div className="flex items-center gap-4 mb-4 cursor-pointer">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      {app.applicant?.avatar_url && (
                        <Image
                          src={app.applicant.avatar_url}
                          alt="Avatar"
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-base hover:underline">
                        {app.applicant?.full_name ||
                          app.applicant?.username ||
                          "Anonymous"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Applied on{" "}
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </ApplicantModal>

                {/* STATUS + ACTION */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles}`}
                  >
                    {app.status}
                  </span>

                  {app.status === "pending" && job.is_open && (
                    <div className="flex gap-3">
                      <form
                        action={async () =>
                          updateStatus(app.id, "accepted", id)
                        }
                      >
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition"
                        >
                          Accept
                        </button>
                      </form>

                      <form
                        action={async () =>
                          updateStatus(app.id, "rejected", id)
                        }
                      >
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}