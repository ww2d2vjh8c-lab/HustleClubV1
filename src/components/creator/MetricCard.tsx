export default function MetricCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
