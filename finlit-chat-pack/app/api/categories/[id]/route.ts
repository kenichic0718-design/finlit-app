// app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin, envReady } from "@/app/_supabase/server";

export const dynamic = "force-dynamic";

// PATCH /api/categories/:id   { name?, order_index? }
export async function PATCH(_req: Request, ctx: { params: { id: string } }) {
  try {
    if (!envReady()) {
      return NextResponse.json({ ok: false, error: "Not ready" }, { status: 500 });
    }

    const id = ctx.params.id;
    const body = await _req.json().catch(() => ({}));
    const updates: Record<string, any> = {};

    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.order_index === "number") updates.order_index = body.order_index;

    if (!Object.keys(updates).length) {
      return NextResponse.json({ ok: false, error: "no updates" }, { status: 400 });
    }

    const supa = getSupabaseAdmin();
    const { data, error } = await supa
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/:id
//   - 通常: 参照ログがあると 409 + { code: "FK_CONSTRAINT" }
//   - force=true: 先に logs を削除してからカテゴリ削除（不可逆）
export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    if (!envReady()) {
      return NextResponse.json({ ok: false, error: "Not ready" }, { status: 500 });
    }

    const id = ctx.params.id;
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "true";

    const supa = getSupabaseAdmin();

    if (force) {
      // 先にこのカテゴリに紐づく logs を削除（不可逆）
      const delLogs = await supa.from("logs").delete().eq("category_id", id);
      if (delLogs.error) {
        return NextResponse.json(
          { ok: false, error: delLogs.error.message, code: delLogs.error.code },
          { status: 500 }
        );
      }
    }

    const delCat = await supa.from("categories").delete().eq("id", id);
    if (delCat.error) {
      // Postgres 外部キー違反は code 23503
      const code = delCat.error.code;
      if (code === "23503") {
        return NextResponse.json(
          {
            ok: false,
            code: "FK_CONSTRAINT",
            error:
              "このカテゴリには記録が残っているため削除できません。記録を別カテゴリへ移動するか、強制削除をご利用ください。",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, error: delCat.error.message, code },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
