// app/api/logs/[id]/route.ts
import { NextResponse } from "next/server";
import { getRouteClient } from "@/lib/supabase/server";

// 共通: 失敗レスポンス
function jerr(error: string, status = 500) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getRouteClient();
    const id = Number(params.id);

    // 認証
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) return jerr("Unauthorized", 401);

    // ユーザー→profile ひも付け
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profErr || !profile) return jerr("Profile not found for user", 401);

    // 入力
    const body = await req.json().catch(() => ({} as any));
    const patch: any = {};
    if (typeof body.amount === "number") patch.amount = body.amount;
    if (typeof body.memo === "string") patch.memo = body.memo;
    if (typeof body.is_income === "boolean") patch.is_income = body.is_income;
    if (typeof body.date === "string") patch.date = body.date; // "YYYY-MM-DD"

    if (Object.keys(patch).length === 0) {
      return jerr("No updatable fields", 400);
    }

    // 所有者制約つき更新（見つからなければ 404）
    const { data, error } = await supabase
      .from("logs")
      .update(patch)
      .eq("id", id)
      .eq("profile_id", profile.id)
      .select()
      .single();

    if (error) {
      // 見つからない系
      if ((error as any).code === "PGRST116") {
        return jerr("Not found or not owned", 404);
      }
      return jerr(error.message ?? "Update failed", 500);
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return jerr(e?.message ?? "Unexpected error", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getRouteClient();
    const id = Number(params.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jerr("Unauthorized", 401);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return jerr("Profile not found for user", 401);

    const { error, count } = await supabase
      .from("logs")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("profile_id", profile.id);

    if (error) return jerr(error.message ?? "Delete failed", 500);
    if (!count) return jerr("Not found or not owned", 404);

    return NextResponse.json({ ok: true, deleted: count });
  } catch (e: any) {
    return jerr(e?.message ?? "Unexpected error", 500);
  }
}

