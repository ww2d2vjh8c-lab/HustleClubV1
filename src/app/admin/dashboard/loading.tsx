export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-56" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
