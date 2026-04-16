import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-8xl font-bold text-slate-900 font-[var(--font-display)]">404</p>
      <h2 className="text-2xl font-semibold text-slate-900">Page not found</h2>
      <p className="text-sm text-slate-500 text-center max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
