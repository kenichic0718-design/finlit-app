// app/_utils/budgetVsActualView.ts
import { getSupabaseClient } from "@/lib/supabaseClient";

export type VRow = {
  profile_id: string;
  yyyymm: string;
  category: string;
  budget_amount: number;
  actual_amount: number;
};

export async function fetchBudgetVsActualRows(params: {
  profileId: string;
  yyyymm: string;
}): Promise<{ rows: VRow[] }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("v_budget_vs_actuals")
    .select("*")
    .eq("profile_id", params.profileId)
    .eq("yyyymm", params.yyyymm)
    .order("category", { ascending: true });

  if (error) throw new Error(`v_budget_vs_actuals fetch error: ${error.message}`);

  return { rows: (data ?? []) as VRow[] };
}

export function calcTotals(rows: VRow[]) {
  const budgetTotal = rows.reduce((s, r) => s + (r.budget_amount ?? 0), 0);
  const actualTotal = rows.reduce((s, r) => s + (r.actual_amount ?? 0), 0);
  const progress = budgetTotal > 0 ? Math.round((actualTotal / budgetTotal) * 100) : 0;
  return { budgetTotal, actualTotal, progress };
}

