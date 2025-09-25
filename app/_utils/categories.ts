// app/_utils/categories.ts
import 'server-only';
import { createClient } from "@/app/_supabase/server";

export type Kind = "expense" | "income";

export async function fetchCategoriesForPick(profileId: string, kind: Kind) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,kind")
    .eq("kind", kind)
    .order("name", { ascending: true });

  if (error) throw error;
  return data!.filter(c => c.name && c.name.trim().length > 0);
}

/** name が無ければ追加して id を返す。既存があればその id。 */
export async function ensureCategory(profileId: string, kind: Kind, name: string) {
  const supabase = createClient();

  const trimmed = name.trim();
  if (!trimmed) throw new Error("カテゴリ名を入力してください。");

  // 既存検索
  const { data: existed, error: selErr } = await supabase
    .from("categories")
    .select("id")
    .eq("kind", kind)
    .ilike("name", trimmed)
    .limit(1);
  if (selErr) throw selErr;

  if (existed && existed.length > 0) {
    return existed[0].id as string;
  }

  // 新規作成
  const { data: inserted, error: insErr } = await supabase
    .from("categories")
    .insert({ name: trimmed, kind })
    .select("id")
    .limit(1);
  if (insErr) throw insErr;

  return inserted![0].id as string;
}

