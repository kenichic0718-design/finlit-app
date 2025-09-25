import { createClient } from "@/app/_supabase/server";

export default async function Page() {
  const supabase = createClient();

  const profileId = "f241530f-2225-4a35-9294-9c965774dca3"; 
  const yyyymm = "202509";

  const { data, error } = await supabase
    .from("budgets")
    .select("id, amount, category_id")
    .eq("profile_id", profileId)
    .eq("yyyymm", yyyymm);

  if (error) {
    console.error(error);
    return <div>エラー: {error.message}</div>;
  }

  return (
    <div>
      <h1>ダッシュボード</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

