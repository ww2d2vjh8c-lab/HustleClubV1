"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-gray-500">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-gray-800"
      >
        Try again
      </button>
    </div>
  );
}
