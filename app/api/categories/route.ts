// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin, envReady } from "@/app/_supabase/server";

export const dynamic = "force-dynamic";

// GET /api/categories?kind=expense|income|all
export async function GET(req: Request) {
  try {
    if (!envReady()) return NextResponse.json({ ok: false, error: "Not ready" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind") ?? "all";

    const supa = getSupabaseAdmin();
    let query = supa.from("v_categories_for_pick").select("*").order("name", { ascending: true });

    if (kind === "expense" || kind === "income") {
      query = query.eq("kind", kind);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "Server error" }, { status: 500 });
  }
}

// POST /api/categories  { name, kind }
export async function POST(req: Request) {
  try {
    if (!envReady()) return NextResponse.json({ ok: false, error: "Not ready" }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const name = (body?.name ?? "").trim();
    const kind = body?.kind === "income" ? "income" : "expense";

    if (!name) return NextResponse.json({ ok: false, error: "name is required" }, { status: 400 });

    const supa = getSupabaseAdmin();

    const { data, error } = await supa
      .from("categories")
      .insert({ name, kind })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "Server error" }, { status: 500 });
  }
}

