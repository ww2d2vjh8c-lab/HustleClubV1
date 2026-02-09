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
  const completed =
    Boolean(username) &&
    Boolean(fullName) &&
    Boolean(avatarUrl) &&
    Boolean(bio);

  return (
    <div
      className={`rounded-xl border p-4 ${
        completed
          ? "border-green-200 bg-green-50"
          : "border-yellow-200 bg-yellow-50"
      }`}
    >
      <p className="text-sm font-medium">
        {completed
          ? "✅ Profile complete"
          : "⚠️ Complete your profile to unlock all features"}
      </p>
    </div>
  );
}
