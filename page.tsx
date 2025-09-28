// app/settings/page.tsx
import { revalidatePath } from "next/cache";
import { createClient } from "@/app/_supabase/server";

// ---- 共通ヘルパ ------------------------------------------------------------
async function getProfileId(): Promise<string> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/profile`, { cache: "no-store" });
  if (!res.ok) throw new Error("プロフィール取得に失敗しました");
  const json = (await res.json()) as { vid: string };
  return json.vid;
}

type Category = { id: string; name: string; kind: "expense" | "income" };

async function fetchCategories(profileId: string): Promise<{
  expense: Category[];
  income: Category[];
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,kind")
    .eq("profile_id", profileId)
    .order("kind", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  const list = (data ?? []) as Category[];
  return {
    expense: list.filter((c) => c.kind === "expense"),
    income: list.filter((c) => c.kind === "income"),
  };
}

// ---- Server Actions ---------------------------------------------------------
// 全アクションは実行後に /settings /log /budgets を再検証して即時反映します
async function afterMutate() {
  revalidatePath("/settings");
  revalidatePath("/log");
  revalidatePath("/budgets");
}

export async function createCategory(formData: FormData) {
  "use server";
  const supabase = createClient();
  const profileId = await getProfileId();

  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "expense") as "expense" | "income";

  if (!name) throw new Error("カテゴリ名を入力してください");

  const { error } = await supabase
    .from("categories")
    .insert({ profile_id: profileId, name, kind });

  // 一意制約（重複）に優しく対応
  if (error && (error as any).code === "23505") {
    throw new Error("同名のカテゴリがすでに存在します");
  }
  if (error) throw error;

  afterMutate();
}

export async function renameCategory(formData: FormData) {
  "use server";
  const supabase = createClient();
  const profileId = await getProfileId();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) throw new Error("ID または 新しい名前が空です");

  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id)
    .eq("profile_id", profileId);

  if (error && (error as any).code === "23505") {
    throw new Error("同名のカテゴリがすでに存在します");
  }
  if (error) throw error;

  afterMutate();
}

export async function deleteCategory(formData: FormData) {
  "use server";
  const supabase = createClient();
  const profileId = await getProfileId();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID が空です");

  // もし logs 側で参照中なら DB の外部キー制約でエラーになる想定。
  // 必要ならここで「このカテゴリを使用しているログは削除/変更してください」と案内メッセージを返すようにしてもOK。
  const { error } = await supabase.from("categories").delete().eq("id", id).eq("profile_id", profileId);
  if (error) throw error;

  afterMutate();
}

// ---- ページ本体 -------------------------------------------------------------
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profileId = await getProfileId();
  const { expense, income } = await fetchCategories(profileId);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-10">
      <h1 className="text-2xl font-semibold">設定</h1>

      {/* 追加フォーム */}
      <section className="rounded-xl border border-neutral-700/50 p-5 space-y-4">
        <h2 className="text-lg font-medium">カテゴリを追加</h2>
        <form action={createCategory} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            name="name"
            placeholder="例）ジム / サブスク / 副収入"
            className="rounded-md border border-neutral-700/50 bg-neutral-900 px-3 py-2 outline-none"
          />
          <select
            name="kind"
            className="rounded-md border border-neutral-700/50 bg-neutral-900 px-3 py-2 outline-none"
            defaultValue="expense"
          >
            <option value="expense">支出カテゴリ</option>
            <option value="income">収入カテゴリ</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500 transition"
          >
            追加
          </button>
        </form>
        <p className="text-sm text-neutral-400">
          ※ 同じ種類（支出/収入）で同名のカテゴリは作成できません。
        </p>
      </section>

      {/* 一覧＋編集 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CategoryColumn title="支出カテゴリ" items={expense} />
        <CategoryColumn title="収入カテゴリ" items={income} />
      </section>
    </div>
  );
}

// ---- 部分コンポーネント（サーバー） ----------------------------------------
function CategoryColumn({ title, items }: { title: string; items: Category[] }) {
  return (
    <div className="rounded-xl border border-neutral-700/50 p-5">
      <h3 className="mb-3 text-base font-medium">{title}</h3>
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            {/* 改名 */}
            <form action={renameCategory} className="flex flex-1 items-center gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input
                name="name"
                defaultValue={c.name}
                className="flex-1 rounded-md border border-neutral-700/50 bg-neutral-900 px-3 py-2 outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-neutral-700 px-3 py-2 text-white hover:bg-neutral-600 transition"
                title="名前を保存"
              >
                保存
              </button>
            </form>

            {/* 削除 */}
            <form
              action={deleteCategory}
              onSubmit={(e) => {
                // no-op: server component; confirm は client じゃないと出せないため省略
              }}
            >
              <input type="hidden" name="id" value={c.id} />
              <button
                type="submit"
                className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-500 transition"
                title="削除"
              >
                削除
              </button>
            </form>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-neutral-400">まだありません</li>
        )}
      </ul>
    </div>
  );
