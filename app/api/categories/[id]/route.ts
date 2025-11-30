// app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin, envReady } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// PATCH /api/categories/:id
// body: { name?: string; order_index?: number; isActive?: boolean }
export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    if (!envReady()) {
      return NextResponse.json(
        { ok: false, error: "Not ready" },
        { status: 500 }
      );
    }

    const id = ctx.params.id;
    const body = (await req.json().catch(() => ({} as any))) as {
      name?: string;
      order_index?: number;
      isActive?: boolean;
    };

    const updates: Record<string, any> = {};

    // 名前変更
    if (typeof body.name === "string") {
      const trimmed = body.name.trim();
      if (trimmed.length > 0) {
        updates.name = trimmed;
      }
    }

    // 並び順
    if (typeof body.order_index === "number") {
      updates.order_index = body.order_index;
    }

    // ★ SettingsCategories.tsx から送られてくる isActive を is_active にマッピング
    if (typeof body.isActive === "boolean") {
      updates.is_active = body.isActive;
    }

    // 何も更新項目がなければ 400
    if (!Object.keys(updates).length) {
      return NextResponse.json(
        { ok: false, error: "no updates" },
        { status: 400 }
      );
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
export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  try {
    if (!envReady()) {
      return NextResponse.json(
        { ok: false, error: "Not ready" },
        { status: 500 }
      );
    }

    const id = ctx.params.id;
    const supa = getSupabaseAdmin();
    const { error } = await supa.from("categories").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

