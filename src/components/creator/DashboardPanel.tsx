import Link from "next/link";

export default function DashboardPanel({
  title,
  emptyText,
  footerHref,
  footerLabel,
  children,
}: {
  title: string;
  emptyText: string;
  footerHref: string;
  footerLabel: string;
  children: React.ReactNode[];
}) {
  const hasItems = children.length > 0;

  return (
    <section className="border rounded-xl p-5 bg-white space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hasItems ? children : <p className="text-sm text-gray-500">{emptyText}</p>}
      {!hasItems && (
        <Link href={footerHref} className="text-sm underline inline-block">
          {footerLabel}
        </Link>
      )}
    </section>
  );
}
