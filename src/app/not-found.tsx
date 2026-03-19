import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Page not found</h2>
      <p className="text-sm text-gray-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-gray-800"
      >
        Go home
      </Link>
    </div>
  );
}
