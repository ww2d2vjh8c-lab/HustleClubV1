type Props = {
  avatarUrl: string | null;
  username: string | null;
  fullName: string | null;
  bio: string | null;
};

export default function ProfileCompletion({
  avatarUrl,
  username,
  fullName,
  bio,
}: Props) {
  const checks = [
    { label: "Username", done: Boolean(username?.trim()) },
    { label: "Full name", done: Boolean(fullName?.trim()) },
    { label: "Avatar", done: Boolean(avatarUrl?.trim()) },
    { label: "Bio", done: Boolean(bio?.trim()) },
  ];
  const completedCount = checks.filter((check) => check.done).length;
  const percent = Math.round((completedCount / checks.length) * 100);
  const completed = completedCount === checks.length;

  return (
    <div
      className={`app-card rounded-xl p-4 ${
        completed
          ? "border-green-200 bg-green-50"
          : "border-yellow-200 bg-yellow-50"
      }`}
    >
      <p className="text-sm font-medium mb-2">
        {completed
          ? "✅ Profile complete"
          : "⚠️ Complete your profile to unlock all features"}
      </p>
      <div className="h-2 rounded-full bg-black/10 overflow-hidden mb-3">
        <div
          className={`h-full ${completed ? "bg-green-500" : "bg-yellow-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-600 mb-2">
        {completedCount}/{checks.length} complete ({percent}%)
      </p>
      <div className="grid sm:grid-cols-2 gap-1 text-xs">
        {checks.map((check) => (
          <p key={check.label} className={check.done ? "text-green-700" : "text-gray-700"}>
            {check.done ? "✓" : "○"} {check.label}
          </p>
        ))}
      </div>
    </div>
  );
}
