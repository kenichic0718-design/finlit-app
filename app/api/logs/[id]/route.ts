// app/api/logs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRouteClient } from "@/lib/supabase/server";

/**
 * 共通: 認証 & プロフィール取得
 */
async function getAuthedProfileId() {
  const supabase = getRouteClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr) {
    return { error: `Auth error: ${authErr.message}` as const, status: 401 };
  }
  if (!user) {
    return { error: "Unauthorized" as const, status: 401 };
  }

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (pErr || !profile) {
    return { error: "Profile not found for user" as const, status: 401 };
  }

  return { profileId: profile.id as string, supabase };
}

/**
 * PATCH /api/logs/:id
 * body: { amount?: number, memo?: string, date?: string(YYYY-MM-DD), is_income?: boolean }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthedProfileId();
    if ("error" in auth) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }
    const { supabase, profileId } = auth;

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    const payload = await req.json().catch(() => ({} as any));

    const updates: Record<string, unknown> = {};
    if (payload.amount !== undefined) updates.amount = Number(payload.amount);
    if (payload.memo !== undefined) updates.memo = String(payload.memo);
    if (payload.date !== undefined) updates.date = String(payload.date);
    if (payload.is_income !== undefined) updates.is_income = !!payload.is_income;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: "No fields to update" }, { status: 400 });
    }

    // 所有チェック（profile_id一致）も条件に含める
    const { data, error } = await supabase
      .from("logs")
      .update(updates)
      .eq("id", id)
      .eq("profile_id", profileId)
      .select("id, profile_id, date, amount, memo, is_income")
      .single();

    if (error) {
      // PGRST116 は該当行なし
      const status = (error as any)?.code === "PGRST116" ? 404 : 500;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }
    if (!data) {
      return NextResponse.json({ ok: false, error: "Not found or not owned" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/logs/:id
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthedProfileId();
    if ("error" in auth) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }
    const { supabase, profileId } = auth;

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("logs")
      .delete()
      .eq("id", id)
      .eq("profile_id", profileId)
      .select("id")
      .single();

    if (error) {
      const status = (error as any)?.code === "PGRST116" ? 404 : 500;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Not found or not owned" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted: 1, id: data.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}

