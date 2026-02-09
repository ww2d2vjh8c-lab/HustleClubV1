export default function Loading() {
  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-xl bg-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}