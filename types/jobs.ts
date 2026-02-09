export type Job = {
  id: number; // ✅ MUST be number (bigint)
  title: string;
  description: string | null;
  created_at: string;

  profile: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
};
