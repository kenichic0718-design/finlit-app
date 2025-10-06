// app/api/categories/sort/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin, envReady } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// body: { kind: "expense" | "income"; ids: string[] }
export async function POST(req: Request) {
  try {
    if (!envReady()) {
      return NextResponse.json({ ok: false, error: "Not ready" }, { status: 500 });
    }
    const body = await req.json().catch(() => ({}));
    const kind = body?.kind;
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

    if (kind !== "expense" && kind !== "income") {
      return NextResponse.json({ ok: false, error: "invalid kind" }, { status: 400 });
    }
    if (ids.length === 0) return NextResponse.json({ ok: true, count: 0 });

    const supa = getSupabaseAdmin();

    // そのkindだけ order_index を 0.. に振り直し
    const updates = ids.map((id, i) => ({ id, order_index: i }));
    const { data, error } = await supa
      .from("categories")
      .upsert(updates, { onConflict: "id" })
      .eq("kind", kind) // 対象kindのみ
      .select("id");

    if (error) throw error;
    return NextResponse.json({ ok: true, count: data?.length ?? 0 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
