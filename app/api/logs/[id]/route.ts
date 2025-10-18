k// app/api/logs/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSupabase, getAuthUser } from "@/lib/supabase/server";

/** id パラメータの安全取得 */
function parseId(param: string | string[] | undefined) {
  if (!param || Array.isArray(param)) return null;
  const n = Number(param);
  return Number.isFinite(n) ? n : null;
}

/** レコード所有者チェック（profiles.user_id 経由） */
async function assertOwnedLog(supabase: ReturnType<typeof getServerSupabase>, logId: number, userId: string) {
  const { data, error } = await supabase
    .from("logs")
    .select("id, profile_id, profiles!inner(user_id)")
    .eq("id", logId)
    .eq("profiles.user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false as const, reason: "db_error", error };
  if (!data) return { ok: false as const, reason: "not_found" };
  return { ok: true as const };
}

/** DELETE /api/logs/:id */
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params?.id);
    if (id == null) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServerSupabase();

    const owned = await assertOwnedLog(supabase, id, user.id);
    if (!owned.ok) {
      const status = owned.reason === "not_found" ? 404 : 500;
      const msg = owned.reason === "not_found" ? "Not found or not owned" : owned.error?.message ?? "DB error";
      return NextResponse.json({ ok: false, error: msg }, { status });
    }

    const { error } = await supabase.from("logs").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deleted: 1 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unhandled error" }, { status: 500 });
  }
}

/** PATCH /api/logs/:id  本文: { date?: string(YYYY-MM-DD), amount?: number, memo?: string|null, is_income?: boolean } */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseId(params?.id);
    if (id == null) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    const payload = (await req.json().catch(() => ({}))) as {
      date?: string;
      amount?: number;
      memo?: string | null;
      is_income?: boolean;
    };

    const updates: Record<string, any> = {};
    if (payload.date != null) updates.date = payload.date; // 文字列 YYYY-MM-DD
    if (payload.amount != null) updates.amount = payload.amount;
    if (payload.memo !== undefined) updates.memo = payload.memo;
    if (payload.is_income != null) updates.is_income = payload.is_income;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: "No fields to update" }, { status: 400 });
    }

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServerSupabase();

    const owned = await assertOwnedLog(supabase, id, user.id);
    if (!owned.ok) {
      const status = owned.reason === "not_found" ? 404 : 500;
      const msg = owned.reason === "not_found" ? "Not found or not owned" : owned.error?.message ?? "DB error";
      return NextResponse.json({ ok: false, error: msg }, { status });
    }

    const { data, error } = await supabase
      .from("logs")
      .update(updates)
      .eq("id", id)
      .select("id, profile_id, date, amount, memo, is_income")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unhandled error" }, { status: 500 });
  }
}

