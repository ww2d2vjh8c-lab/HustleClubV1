export default function CardSkeleton() {
  return (
    <div className="border rounded-xl p-4 space-y-4 animate-pulse bg-white">
      <div className="h-40 bg-gray-200 rounded-lg" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-100 rounded w-1/2" />
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-gray-200 rounded" />
        <div className="h-8 w-20 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
