// app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin, envReady } from "@/app/_supabase/server";

export const dynamic = "force-dynamic";

// PATCH /api/categories/:id   { name?, order_index? }
export async function PATCH(
  _req: Request,
  ctx: { params: { id: string } }
) {
  try {
    if (!envReady()) return NextResponse.json({ ok: false, error: "Not ready" }, { status: 500 });

    const id = ctx.params.id;
    const body = await _req.json().catch(() => ({}));
    const updates: any = {};

    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.order_index === "number") updates.order_index = body.order_index;

    if (!Object.keys(updates).length) {
      return NextResponse.json({ ok: false, error: "no updates" }, { status: 400 });
    }

    const supa = getSupabaseAdmin();
    const { data, error } = await supa.from("categories").update(updates).eq("id", id).select("*").single();
    if (error) throw error;

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "Server error" }, { status: 500 });
  }
}

// DELETE /api/categories/:id
export async function DELETE(
  _req: Request,
  ctx: { params: { id: string } }
) {
  try {
    if (!envReady()) return NextResponse.json({ ok: false, error: "Not ready" }, { status: 500 });

    const id = ctx.params.id;
    const supa = getSupabaseAdmin();
    const { error } = await supa.from("categories").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "Server error" }, { status: 500 });
  }
}

