// types/profile.ts

export type UserRole = "user" | "creator" | "admin";

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole | null;
  created_at: string | null;
};
