export default function Card({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}
