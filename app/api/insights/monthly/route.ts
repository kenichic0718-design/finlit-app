// app/api/insights/monthly/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRoute } from "@/app/_supabase/route";

export const dynamic = "force-dynamic";

function ymRange(ym?: string) {
  const now = new Date();
  const [y, m] = (ym ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
    .split("-")
    .map(Number);
  const start = new Date(y, (m ?? now.getMonth() + 1) - 1, 1);
  const end = new Date(y, (m ?? now.getMonth() + 1), 1);
  const month = `${y.toString().padStart(4, "0")}-${String(m).padStart(2, "0")}`;
  return { start, end, month };
}

function ok(data: any = {}) {
  return NextResponse.json({ ok: true, ...data });
}
function ng(msg: string, status = 500, extra: any = {}) {
  return NextResponse.json({ ok: false, error: msg, ...extra }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ym = url.searchParams.get("month") ?? url.searchParams.get("ym") ?? undefined;
    const { start, end, month } = ymRange(ym);

    const supabase = getSupabaseRoute();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return ok({
        month,
        guest: true,
        income: 0,
        expense: 0,
        net: 0,
        daily: [],
        byCategory: [],
        budget_total: 0,
        budget_remaining: 0,
      });

    // logs -> totals/daily/per-category
    const { data: logs, error: lErr } = await supabase
      .from("logs")
      .select("kind, amount, at, category_id, categories(name)")
      .eq("user_id", user.id)
      .gte("at", start.toISOString())
      .lt("at", end.toISOString());
    if (lErr) return ng(lErr.message, 500);

    let income = 0,
      expense = 0;
    const dailyMap = new Map<number, { day: number; income: number; expense: number; net: number }>();
    const perCat = new Map<string, number>(); // expense only

    (logs ?? []).forEach((r: any) => {
      const d = new Date(r.at);
      const day = d.getDate();
      const row = dailyMap.get(day) ?? { day, income: 0, expense: 0, net: 0 };
      if (r.kind === "income") {
        row.income += Number(r.amount || 0);
        income += Number(r.amount || 0);
      } else {
        row.expense += Number(r.amount || 0);
        expense += Number(r.amount || 0);
        const name = r.categories?.name ?? "(不明)";
        perCat.set(name, (perCat.get(name) || 0) + Number(r.amount || 0));
      }
      row.net = row.income - row.expense;
      dailyMap.set(day, row);
    });

    const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) , 0).getDate();
    const daily = Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
      return dailyMap.get(d) ?? { day: d, income: 0, expense: 0, net: 0 };
    });

    const byCategory = Array.from(perCat.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // budgets（ビューがあれば使う）
    let budget_total = 0,
      budget_remaining = 0;

    const { data: vrows, error: vErr } = await supabase
      .from("v_budget_vs_actual")
      .select("budget_amount, actual_amount")
      .eq("profile_id", user.id)
      .eq("yyyymm", month);

    if (!vErr && vrows) {
      vrows.forEach((r: any) => {
        budget_total += Number(r.budget_amount || 0);
        const actualExpense = Math.max(0, Number(r.actual_amount || 0));
        budget_remaining += Number(r.budget_amount || 0) - actualExpense;
      });
      budget_remaining = Math.max(0, budget_remaining);
    } else {
      // フォールバック（budgets と expense 合計から算出）
      const { data: budgets } = await supabase
        .from("budgets")
        .select("amount, kind")
        .eq("user_id", user.id)
        .eq("month", month);
      (budgets ?? []).forEach((b: any) => {
        if (b.kind === "expense") budget_total += Number(b.amount || 0);
      });
      budget_remaining = Math.max(0, budget_total - expense);
    }

    return ok({
      month,
      income,
      expense,
      net: income - expense,
      daily,
      byCategory,
      budget_total,
      budget_remaining,
    });
  } catch (e: any) {
    return ng(e?.message ?? "unexpected_error", 500);
  }
}

