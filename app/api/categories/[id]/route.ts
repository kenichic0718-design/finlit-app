// app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRoute } from "@/app/_supabase/route";

function ok(data: any = {}) {
  return NextResponse.json({ ok: true, ...data });
}
function ng(msg: string, status = 500) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseRoute();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return ng("sign_in_required", 401);

    const body = await req.json();
    const name = String(body?.name || "").trim();
    if (!name) return ng("name required", 400);

    const { error } = await supabase
      .from("categories")
      .update({ name })
      .match({ id: params.id, profile_id: user.id });

    if (error) {
      if (error.code === "23505") return ng("同名カテゴリが既にあります", 409);
      return ng(error.message);
    }
    return ok();
  } catch (e: any) {
    return ng(e?.message ?? "unexpected_error");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseRoute();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return ng("sign_in_required", 401);

    const { error } = await supabase
      .from("categories")
      .delete()
      .match({ id: params.id, profile_id: user.id });

    if (error) {
      // 参照制約 (logs/budgets) で落ちた場合
      if (error.code === "23503") {
        return ng("このカテゴリは使用中のため削除できません（記録や予算を先に見直してください）", 409);
      }
      return ng(error.message);
    }
    return ok();
  } catch (e: any) {
    return ng(e?.message ?? "unexpected_error");
  }
}

