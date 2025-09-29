// app/api/budgets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRoute } from "@/app/_supabase/route";

function ok(data: any = {}) {
  return NextResponse.json({ ok: true, ...data });
}
function ng(message: string, status = 500, extra: any = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}
function asInt(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : def;
}

// ---- GET /api/budgets?month=YYYY-MM ---------------------------
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseRoute();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user ?? null;

    const url = new URL(req.url);
    const month = url.searchParams.get("month") ?? "";

    if (!user) return ok({ guest: true, items: [] });
    if (!/^\d{4}-\d{2}$/.test(month)) return ng("invalid month", 400);

    const { data, error } = await supabase
      .from("budgets")
      .select("id, month, kind, category_id, amount")
      .eq("user_id", user.id)
      .eq("month", month);

    if (error) return ng(error.message, 500);
    return ok({ items: data, data });
  } catch (e: any) {
    return ng(e?.message ?? "unexpected_error", 500);
  }
}

// ---- POST /api/budgets ----------------------------------------
/**
 * body: { month: "YYYY-MM", kind: "expense"|"income", category_id: string, amount: number }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseRoute();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user ?? null;

    if (!user) return ok({ guest: true, error: "signin_required" });

    const body = await req.json().catch(() => ({}));
    const month = typeof body?.month === "string" ? body.month : "";
    const kind = typeof body?.kind === "string" ? body.kind : "";
    const category_id = typeof body?.category_id === "string" ? body.category_id : "";
    const amount = asInt(body?.amount, NaN);

    if (!/^\d{4}-\d{2}$/.test(month)) return ng("invalid month", 400);
    if (!["expense", "income"].includes(kind)) return ng("invalid kind", 400);
    if (!category_id) return ng("category_id required", 400);
    if (!Number.isFinite(amount) || amount < 0) return ng("invalid amount", 400);

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

