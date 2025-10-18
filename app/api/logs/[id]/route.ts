// app/api/logs/[id]/route.ts
export const runtime = "nodejs";         // ← Node で実行
export const dynamic = "force-dynamic";  // ← キャッシュ無効（念のため）

import { NextResponse } from "next/server";
import { getServerSupabase, getAuthUser } from "@/lib/supabase/server";

function parseId(id: string | string[] | undefined) {
  if (!id || Array.isArray(id)) return null;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

async function assertOwnedLog(
  supabase: ReturnType<typeof getServerSupabase>,
  logId: number,
  userId: string
) {
  const { data, error } = await supabase
    .from("logs")
    .select("id, profile_id, profiles!inner(user_id)")
    .eq("id", logId)
    .eq("profiles.user_id", userId)
    .maybeSingle();

  if (error) return { ok: false as const, reason: "db", message: error.message };
  if (!data) return { ok: false as const, reason: "not_owned" as const };
  return { ok: true as const };
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params?.id);
    if (id == null) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

    const user = await getAuthUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const supabase = getServerSupabase();
    const owned = await assertOwnedLog(supabase, id, user.id);
    if (!owned.ok) {
      const status = owned.reason === "not_owned" ? 404 : 500;
      return NextResponse.json({ ok: false, error: owned.reason === "not_owned" ? "Not found or not owned" : owned.message }, { status });
    }

    const { error } = await supabase.from("logs").delete().eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, deleted: 1 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unhandled" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params?.id);
    if (id == null) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

    const json = await req.json().catch(() => ({} as any));
    const updates: Record<string, any> = {};
    if (json.date !== undefined) updates.date = json.date;
    if (json.amount !== undefined) updates.amount = json.amount;
    if (json.memo !== undefined) updates.memo = json.memo;
    if (json.is_income !== undefined) updates.is_income = json.is_income;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: "No fields to update" }, { status: 400 });
    }

    const user = await getAuthUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const supabase = getServerSupabase();
    const owned = await assertOwnedLog(supabase, id, user.id);
    if (!owned.ok) {
      const status = owned.reason === "not_owned" ? 404 : 500;
      return NextResponse.json({ ok: false, error: owned.reason === "not_owned" ? "Not found or not owned" : owned.message }, { status });
    }

    const { data, error } = await supabase
      .from("logs")
      .update(updates)
      .eq("id", id)
      .select("id, profile_id, date, amount, memo, is_income")
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unhandled" }, { status: 500 });
  }
}

