// app/api/logs/[id]/route.ts
import { NextResponse } from "next/server";
import { getRouteSupabase } from "@/app/_supabase/route"; // ← 既に使っている route-safe ラッパー

type Params = { params: { id: string } };

async function ensureProfileId(sb: ReturnType<typeof getRouteSupabase>["client"]) {
  const { data: auth } = await sb.auth.getUser();
  if (!auth?.user) return { ok: false as const, status: 401, error: "Unauthorized" };

  // 既存プロファイル検索
  const { data: prof, error: selErr } = await sb
    .from("profiles")
    .select("id,user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (selErr) {
    return { ok: false as const, status: 500, error: selErr.message };
  }
  if (prof) {
    return { ok: true as const, profileId: prof.id };
  }

  // なければ lazy create（必要に応じて残してOK。自動作成したくなければここを return 404 に）
  const { data: created, error: insErr } = await sb
    .from("profiles")
    .insert({ user_id: auth.user.id })
    .select("id")
    .single();

  if (insErr) {
    return { ok: false as const, status: 403, error: "Profile not found for user" };
  }

  return { ok: true as const, profileId: created.id };
}

export async function PATCH(req: Request, { params }: Params) {
  const { client: sb } = getRouteSupabase();
  const guard = await ensureProfileId(sb);
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  const id = params.id;
  let body: Partial<{ amount: number; memo: string | null; date: string; is_income: boolean }>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // 余計なカラムを弾く
  const patch: any = {};
  if (typeof body.amount === "number") patch.amount = body.amount;
  if (typeof body.memo === "string" || body.memo === null) patch.memo = body.memo ?? null;
  if (typeof body.date === "string") patch.date = body.date;
  if (typeof body.is_income === "boolean") patch.is_income = body.is_income;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "No fields to update" }, { status: 400 });
  }

  // 所有者制約: id と profile_id の両方で絞る
  const { data, error } = await sb
    .from("logs")
    .update(patch)
    .eq("id", id)
    .eq("profile_id", guard.profileId)
    .select("id, profile_id, date, amount, memo, is_income")
    .maybeSingle();

  if (error) {
    // RLS で弾かれた場合など
    return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "Not found or not owned" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { client: sb } = getRouteSupabase();
  const guard = await ensureProfileId(sb);
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  const { data, error } = await sb
    .from("logs")
    .delete()
    .eq("id", params.id)
    .eq("profile_id", guard.profileId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "Not found or not owned" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, deleted: data.id });
}

