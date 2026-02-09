type ProfileHoverCardProps = {
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export default function ProfileHoverCard({
  username,
  fullName,
  avatarUrl,
  bio,
}: ProfileHoverCardProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div>
        <p className="text-sm font-medium">
          {fullName || username || "Anonymous"}
        </p>

        {bio && (
          <p className="text-xs text-gray-500 line-clamp-1">
            {bio}
          </p>
        )}
      </div>
    </div>
  );
}
