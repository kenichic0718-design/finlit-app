import dayjs from "dayjs";
import { supabase } from "./supabase";

export type NewLog = {
  category_id: string;
  amount: number;
  happened_on: string; // "YYYY-MM-DD"
  note?: string | null;
};

export async function addLog(input: NewLog) {
  const { error } = await supabase.from("logs").insert({
    category_id: input.category_id,
    amount: input.amount,
    happened_on: input.happened_on,
    note: input.note ?? null,
    // profile_id はトリガで自動付与
  });
  if (error) throw error;
}

/** 直近 n 件。カテゴリ名も一緒に */
export async function getRecentLogs(limit = 50) {
  const { data, error } = await supabase
    .from("logs")
    .select("id, category_id, amount, happened_on, note, categories(name,color)")
    .order("happened_on", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** 月次集計（クライアント集計の簡易版） */
export async function getMonthlyTotals(yyyymm = dayjs().format("YYYYMM")) {
  // 今月分を fetch → JS で集計
  const start = dayjs(yyyymm + "01");
  const end = start.endOf("month");

  const { data, error } = await supabase
    .from("logs")
    .select("category_id, amount")
    .gte("happened_on", start.format("YYYY-MM-DD"))
    .lte("happened_on", end.format("YYYY-MM-DD"));

  if (error) throw error;

  const map = new Map<string, number>();
  for (const r of data ?? []) {
    map.set(r.category_id, (map.get(r.category_id) ?? 0) + (r.amount as number));
  }
  return map; // Map<category_id, sumAmount>
}

