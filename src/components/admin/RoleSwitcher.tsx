"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateUserRole } from "@/app/admin/actions";

type Role = "user" | "creator" | "admin";

export default function RoleSwitcher({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: Role;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setRole(role: Role) {
    startTransition(async () => {
      try {
        setError(null);
        await updateUserRole(userId, role);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update role");
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 text-xs">
        {(["user", "creator", "admin"] as Role[]).map((role) => (
          <button
            key={role}
            disabled={pending || role === currentRole}
            onClick={() => setRole(role)}
            className={`px-3 py-1 rounded-full border capitalize ${
              role === currentRole
                ? "bg-slate-900 text-white border-slate-900"
                : "border-slate-300 hover:bg-slate-50"
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
