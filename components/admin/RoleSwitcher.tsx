"use client";

import { useTransition } from "react";
import { updateUserRole } from "@/app/admin/actions";

type Role = "user" | "creator" | "admin";

export default function RoleSwitcher({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: Role;
}) {
  const [pending, startTransition] = useTransition();

  function setRole(role: Role) {
    startTransition(async () => {
      await updateUserRole(userId, role);
    });
  }

  return (
    <div className="flex gap-2 text-xs">
      {(["user", "creator", "admin"] as Role[]).map((role) => (
        <button
          key={role}
          disabled={pending || role === currentRole}
          onClick={() => setRole(role)}
          className={`px-3 py-1 rounded border capitalize
            ${
              role === currentRole
                ? "bg-black text-white"
                : "hover:bg-gray-100"
            }`}
        >
          {role}
        </button>
      ))}
    </div>
  );
}
