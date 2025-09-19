"use client";

import { getSupabaseClient } from "@/lib/supabaseClient";
const supabase = getSupabaseClient();

export type BudgetActualRow = {
  category: string;
  budget: number;   // その月の予算
  actual: number;   // その月の支出合計（収入は含めない）
  income?: number;  // その月の収入合計（任意）
};

type LogRow = { category: string | null; amount: number; is_income: boolean };
type BudgetRow = { category: string | null; amount: number };

function monthRange(yyyymm: string): { from: string; to: string } {
  const y = Number(yyyymm.slice(0, 4));
  const m = Number(yyyymm.slice(4, 6));
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 1));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

export async function fetchBudgetVsActual(yyyymm: string, profileId: string) {
  // 予算
  const { data: budgets, error: budgetErr } = await supabase
    .from("budgets")
    .select("category, amount")
    .eq("profile_id", profileId)
    .eq("yyyymm", yyyymm);
  if (budgetErr) throw new Error(`予算取得エラー: ${budgetErr.message}`);

  // 実績（当月）
  const { from, to } = monthRange(yyyymm);
  const { data: logs, error: logsErr } = await supabase
    .from("logs")
    .select("category, amount, is_income")
    .eq("profile_id", profileId)
    .gte("ymd", from)
    .lt("ymd", to);
  if (logsErr) throw new Error(`実績取得エラー: ${logsErr.message}`);

  const spentByCat = new Map<string, number>();
  const incomeByCat = new Map<string, number>();

  (logs as LogRow[] | null ?? []).forEach((l) => {
    const key = l.category ?? "未分類";
    const amt = Number(l.amount) || 0; // ← 常に正
    if (l.is_income) {
      incomeByCat.set(key, (incomeByCat.get(key) ?? 0) + amt);
    } else {
      spentByCat.set(key, (spentByCat.get(key) ?? 0) + amt);
    }
  });

  const budgetByCat = new Map<string, number>();
  (budgets as BudgetRow[] | null ?? []).forEach((b) => {
    budgetByCat.set(b.category ?? "未分類", Number(b.amount) || 0);
  });

  const categories = new Set<string>([
    ...budgetByCat.keys(),
    ...spentByCat.keys(),
    ...incomeByCat.keys(),
  ]);

  const rows: BudgetActualRow[] = Array.from(categories).map((cat) => ({
    category: cat,
    budget: budgetByCat.get(cat) ?? 0,
    actual: spentByCat.get(cat) ?? 0,   // 支出合計
    income: incomeByCat.get(cat) ?? 0,  // 収入合計（参考）
  }));

  rows.sort((a, b) => (b.budget - a.budget) || a.category.localeCompare(b.category));
  return rows;
}

export function summarize(rows: BudgetActualRow[]) {
  const budget = rows.reduce((s, r) => s + r.budget, 0);
  const spent  = rows.reduce((s, r) => s + r.actual, 0);
  const income = rows.reduce((s, r) => s + (r.income ?? 0), 0);
  const progress = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  return { budget, spent, income, progress };
}

