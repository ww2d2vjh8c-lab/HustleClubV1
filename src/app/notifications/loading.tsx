export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded-xl" />
      ))}
    </div>
  );
}
