// app/api/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRoute } from "@/app/_supabase/route";

// ---- helpers --------------------------------------------------
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
function monthRange(ym?: string) {
  if (!ym) return { gte: undefined as string | undefined, lt: undefined as string | undefined };
  // ym = "2025-09"
  const [y, m] = ym.split("-").map((x) => Number(x));
  const from = new Date(Date.UTC(y, (m - 1), 1)).toISOString();
  const to = new Date(Date.UTC(y, m, 1)).toISOString(); // next month 1st
  return { gte: from, lt: to };
}

// ---- GET /api/logs?limit=10&month=YYYY-MM ---------------------
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseRoute();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user ?? null;

    const url = new URL(req.url);
    const limit = asInt(url.searchParams.get("limit") ?? 10, 10);
    const ym = url.searchParams.get("month") ?? undefined;

    // ゲスト：空配列を返却（赤ログ出さない）
    if (!user) return ok({ guest: true, items: [] });

    const q = supabase
      .from("logs")
      .select("id, kind, amount, at, category_id")
      .eq("user_id", user.id)
      .order("at", { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 100));

    // 月フィルタ（任意）
    const range = monthRange(ym);
    if (range.gte && range.lt) q.gte("at", range.gte).lt("at", range.lt);

    const { data, error } = await q;
    if (error) return ng(error.message, 500);

    // 後方互換のため data ミラーも返す
    return ok({ items: data, data });
  } catch (e: any) {
    return ng(e?.message ?? "unexpected_error", 500);
  }
}

// ---- POST /api/logs -------------------------------------------
/**
 * body: { kind: "expense"|"income", category_id: string, amount: number, at?: ISOstring }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseRoute();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user ?? null;

    // ゲスト：200で返す（UIは案内表示）
    if (!user) return ok({ guest: true, error: "signin_required" });

    const body = await req.json().catch(() => ({}));
    const kind = typeof body?.kind === "string" ? body.kind : "";
    const category_id = typeof body?.category_id === "string" ? body.category_id : "";
    const amount = asInt(body?.amount, NaN);
    const at: string | undefined =
      typeof body?.at === "string" ? new Date(body.at).toISOString() : new Date().toISOString();

    if (!["expense", "income"].includes(kind)) return ng("invalid kind", 400);
    if (!category_id) return ng("category_id required", 400);
    if (!Number.isFinite(amount) || amount < 0) return ng("invalid amount", 400);

    const row = { user_id: user.id, kind, category_id, amount, at };
    const { error } = await supabase.from("logs").insert(row);
    if (error) return ng(error.message, 500);

    return ok();
  } catch (e: any) {
    return ng(e?.message ?? "unexpected_error", 500);
  }
}

