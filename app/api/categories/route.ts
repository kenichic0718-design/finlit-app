// app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRoute } from "@/app/_supabase/route";

function ok(data: any = {}) {
  return NextResponse.json({ ok: true, ...data });
}
function ng(msg: string, status = 500) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

// GET /api/categories?kind=expense|income
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const kind = (url.searchParams.get("kind") || "expense") as "expense" | "income";
  try {
    const supabase = getSupabaseRoute();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return ok({ guest: true, items: [] });

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, kind, order_index, created_at")
      .eq("profile_id", user.id)
      .eq("kind", kind)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) return ng(error.message);
    return ok({ items: data || [] });
  } catch (e: any) {
    return ng(e?.message ?? "unexpected_error");
  }
}

// POST /api/categories { name, kind, order_index? }
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseRoute();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return ng("sign_in_required", 401);

    const body = await req.json();
    const name = String(body?.name || "").trim();
    const kind = String(body?.kind || "expense");
    const order_index = Number.isFinite(body?.order_index) ? Number(body.order_index) : 0;

    if (!name) return ng("name required", 400);
    if (!["expense", "income"].includes(kind)) return ng("invalid kind", 400);

    const { error } = await supabase
      .from("categories")
      .insert({ profile_id: user.id, name, kind, order_index });

    if (error) {
      // UNIQUE (profile_id, name, kind)
      if (error.code === "23505") return ng("同名カテゴリが既にあります", 409);
      return ng(error.message);
    }
    return ok();
  } catch (e: any) {
    return ng(e?.message ?? "unexpected_error");
  }
}

