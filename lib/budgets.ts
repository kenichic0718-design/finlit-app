import dayjs from "dayjs";
import { supabase } from "./supabase";

export type BudgetRow = { category_id: string; yyyymm: string; amount: number };

export function currentYyyymm() {
  return dayjs().format("YYYYMM");
}

/** 今月の予算を Map<category_id, amount> で返す。未登録は 0 として扱える */
export async function getBudgetMapForThisMonth() {
  const yyyymm = currentYyyymm();
  const { data, error } = await supabase
    .from("budgets")
    .select("category_id, amount")
    .eq("yyyymm", yyyymm);

  if (error) throw error;
  return new Map((data ?? []).map((r) => [r.category_id as string, r.amount as number]));
}

/** upsert（複合ユニーク: profile_id, category_id, yyyymm） */
export async function upsertBudgets(rows: BudgetRow[]) {
  const { error } = await supabase
    .from("budgets")
    .upsert(rows, { onConflict: "profile_id,category_id,yyyymm" });
  if (error) throw error;
}

/** 単体更新のユーティリティ */
export async function setBudgetAmount(category_id: string, amount: number, yyyymm = currentYyyymm()) {
  await upsertBudgets([{ category_id, yyyymm, amount }]);
}

