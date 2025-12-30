import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>You must be logged in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-400">
        Welcome back, <span className="text-blue-400">{user.email}</span> 👋
      </p>
    </div>
  );
}