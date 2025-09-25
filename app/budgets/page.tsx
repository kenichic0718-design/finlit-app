// app/budgets/page.tsx
import { createClient } from "@/app/_supabase/server";
import BudgetForm from "./_BudgetForm";
import { revalidatePath } from "next/cache";

export const revalidate = 0;           // ← 常に最新
export const dynamic = "force-dynamic"; // ← 動的レンダリングを強制（保険）

async function getProfileId(): Promise<string> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/profile`, { cache: "no-store" });
  if (!res.ok) throw new Error("プロフィール取得に失敗しました");
  const json = (await res.json()) as { vid: string };
  return json.vid;
}

type Category = { id: string; name: string; kind: "expense" | "income" };

async function fetchCategories(profileId: string): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,kind")
    .eq("profile_id", profileId)
    .order("kind", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Category[];
}

// 予算の登録（例）
export async function createBudget(formData: FormData) {
  "use server";
  const supabase = createClient();

  const profileId = String(formData.get("profileId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const yyyymm = String(formData.get("yyyymm") ?? "");

  if (!profileId || !categoryId || !amount) {
    throw new Error("必須項目が不足しています");
  }

  const { error } = await supabase.from("budgets").insert({
    profile_id: profileId,
    category_id: categoryId,
    amount,
    yyyymm: yyyymm || null,
  });
  if (error) throw error;

  revalidatePath("/budgets");
  revalidatePath("/log");
}

export default async function Page() {
  const profileId = await getProfileId();
  const categories = await fetchCategories(profileId);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">予算の追加</h1>
      <BudgetForm
        profileId={profileId}
        categories={categories}
        onSubmit={createBudget}
      />
    </div>
  );
}

