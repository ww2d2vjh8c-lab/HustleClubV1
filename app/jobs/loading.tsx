import JobCardSkeleton from "@/components/jobs/JobCardSkeleton";

export default function JobsLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Jobs</h1>

      {Array.from({ length: 4 }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}
