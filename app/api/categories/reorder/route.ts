// app/api/categories/reorder/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin, envReady } from "@/lib/supabase/server";

/**
 * POST /api/categories/reorder
 * body: { kind: "expense" | "income", ids: string[] }
 * 指定 kind の categories を ids の順に order_index を 0..N で付け直す
 */
export async function POST(req: Request) {
  try {
    if (!envReady()) {
      return NextResponse.json({ ok: false, error: "Not ready" }, { status: 500 });
    }

    const { kind, ids } = (await req.json()) as {
      kind: "expense" | "income";
      ids: string[];
    };

    if (kind !== "expense" && kind !== "income") {
      return NextResponse.json({ ok: false, error: "invalid kind" }, { status: 400 });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ ok: false, error: "ids required" }, { status: 400 });
    }

    const supa = getSupabaseAdmin();

    // 同じ kind の order_index を全リセット → まとめて再付与
    // （競合を避けるためトランザクション的に処理：RPC は使わず素直に1本ずつ更新でもOK）
    // ここでは簡潔に 1 本ずつ更新します
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const { error } = await supa
        .from("categories")
        .update({ order_index: i })
        .eq("id", id)
        .eq("kind", kind);

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
