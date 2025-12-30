import { createClient } from '@/lib/supabase/server';

export default async function TestSupabasePage() {
  const supabase = await createClient(); // ✅ now async
  const { data, error } = await supabase.from('profiles').select('*').limit(1);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Supabase Test</h1>
      {error && <p className="text-red-500">Error: {error.message}</p>}
      {data && (
        <pre className="bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}