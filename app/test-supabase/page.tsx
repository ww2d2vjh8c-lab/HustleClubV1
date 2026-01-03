import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TestSupabasePage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .limit(5);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Supabase Test</h1>

      {error && (
        <p className="text-red-500">
          Error: {error.message}
        </p>
      )}

      {data && (
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
