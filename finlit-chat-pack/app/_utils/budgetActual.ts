// app/_utils/budgetActual.ts
import { getSupabaseClient } from "@/lib/supabaseClient";

export type BudgetVsActualRow = {
  profile_id: string;
  yyyymm: string;
  category: string;
  budget_amount: number;
  actual_amount: number;
};

export async function fetchBudgetVsActual(
  yyyymm: string,
  profileId: string
): Promise<BudgetVsActualRow[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("v_budget_vs_actual")
    .select("profile_id, yyyymm, category, budget_amount, actual_amount")
    .eq("profile_id", profileId)
    .eq("yyyymm", yyyymm);

  if (error) {
    console.error("Error fetching budget vs actual:", error);
    return [];
  }
  return data as BudgetVsActualRow[];
}

