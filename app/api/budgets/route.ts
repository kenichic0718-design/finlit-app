// app/api/budgets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRoute } from "@/app/_supabase/route";

type Item = {
  category: string;
  category_id: string;
  kind: "expense" | "income";
  budget: number;
  actual: number;
};

function ok(data: any = {}) {
  return NextResponse.json({ ok: true, ...data });
}
function ng(message: string, status = 500, extra: any = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

function toYYYYMM(ym?: string | null) {
  const now = new Date();
  const base = (ym ?? "").match(/^\d{4}-\d{2}$/)
    ? ym!
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return base;
}

// ---------- GET /api/budgets?month=YYYY-MM ----------
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const month = toYYYYMM(url.searchParams.get("month"));
    const supabase = getSupabaseRoute();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return ok({
        guest: true,
        month,
        items: [],
        totals: { budget: 0, actual: 0, remaining: 0 },
      });

    // まずはビューを優先
    const { data: vrows, error: vErr } = await supabase
      .from("v_budget_vs_actual")
      .select("category, yyyymm, budget_amount, actual_amount")
      .eq("profile_id", user.id)
      .eq("yyyymm", month);

    if (!vErr && vrows) {
      const items = (vrows as any[]).map((r) => ({
        category: r.category,
        category_id: "",
        kind: "expense" as const,
        budget: Number(r.budget_amount ?? 0),
        actual: Math.max(0, Number(r.actual_amount ?? 0)), // expense を正値で
      }));
      const totals = items.reduce(
        (acc, it) => {
          acc.budget += it.budget;
          acc.actual += it.actual;
          return acc;
        },
        { budget: 0, actual: 0 }
      );
      return ok({
        month,
        items,
        totals: { ...totals, remaining: Math.max(0, totals.budget - totals.actual) },
      });
    }

    // フォールバック（budgets + logs を月範囲で集計）
    const { data: budgets, error: bErr } = await supabase
      .from("budgets")
      .select("category_id, amount, kind, month, categories(name)")
      .eq("user_id", user.id)
      .eq("month", month);
    if (bErr) return ng(bErr.message, 500);

    const start = new Date(`${month}-01T00:00:00Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const { data: logs, error: lErr } = await supabase
      .from("logs")
      .select("category_id, amount, kind, at")
      .eq("user_id", user.id)
      .gte("at", start.toISOString())
      .lt("at", end.toISOString());
    if (lErr) return ng(lErr.message, 500);

    const actualByCat = new Map<string, number>();
    (logs ?? []).forEach((r: any) => {
      const k = r.category_id;
      const v = actualByCat.get(k) ?? 0;
      actualByCat.set(k, v + (r.kind === "expense" ? Number(r.amount || 0) : 0));
    });

    const items: Item[] = (budgets ?? []).map((b: any) => ({
      category: b.categories?.name ?? "(不明)",
      category_id: b.category_id,
      kind: b.kind,
      budget: Number(b.amount || 0),
      actual: Number(actualByCat.get(b.category_id) || 0),
    }));

    const totals = items.reduce(
      (acc, it) => {
        acc.budget += it.budget;
        acc.actual += it.actual;
        return acc;
      },
      { budget: 0, actual: 0 }
    );

    return ok({
      month,
      items,
      totals: { ...totals, remaining: Math.max(0, totals.budget - totals.actual) },
    });
  } catch (e: any) {
    return ng(e?.message ?? "unexpected_error");
  }
}

// ---------- POST /api/budgets ----------
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseRoute();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return ng("sign_in_required", 401);

    const payload = await req.json();
    const month = toYYYYMM(payload?.month);
    const kind = String(payload?.kind ?? "expense");
    const category_id = String(payload?.category_id || "");
    const amount = Number(payload?.amount ?? 0);

    if (!/^\d{4}-\d{2}$/.test(month)) return ng("invalid month", 400);
    if (!["expense", "income"].includes(kind)) return ng("invalid kind", 400);
    if (!category_id) return ng("category_id required", 400);
    if (!(Number.isFinite(amount) && amount >= 0)) return ng("invalid amount", 400);

    const { error } = await supabase
      .from("budgets")
      .upsert(
        { user_id: user.id, month, kind, category_id, amount },
        { onConflict: "user_id,month,kind,category_id" }
      );

    if (error) return ng(error.message, 500);
    return ok();
  } catch (e: any) {
    return ng(e?.message ?? "unexpected_error", 500);
  }
}

