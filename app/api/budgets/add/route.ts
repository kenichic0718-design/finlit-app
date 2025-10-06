// app/api/budgets/add/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer as createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const form = await req.formData();

  const profile_id = String(form.get("profile_id") || "");
  const category_id = String(form.get("category_id") || "");
  const new_category_name = String(form.get("new_category_name") || "").trim();
  const amount = Number(form.get("amount") || 0);
  const yyyymm = String(form.get("yyyymm") || "").trim();
  const kind = "expense"; // ここは要件に合わせて

  if (!profile_id) return NextResponse.json({ ok: false, error: "profile_id missing" }, { status: 400 });
  if (!yyyymm)   return NextResponse.json({ ok: false, error: "yyyymm missing" }, { status: 400 });

  let finalCategoryId = category_id;

  if (category_id === "__OTHER__") {
    if (!new_category_name) {
      return NextResponse.json({ ok: false, error: "新しいカテゴリ名を入力してください" }, { status: 400 });
    }
    // 既存チェック
    const { data: exist } = await supabase
      .from("categories")
      .select("id")
      .eq("name", new_category_name)
      .eq("kind", kind)
      .maybeSingle();

    if (exist?.id) {
      finalCategoryId = exist.id;
    } else {
      const { data: inserted, error: catErr } = await supabase
        .from("categories")
        .insert({ name: new_category_name, kind })
        .select("id")
        .single();
      if (catErr) return NextResponse.json({ ok: false, error: catErr.message }, { status: 400 });
      finalCategoryId = inserted.id;
    }
  }

  const { error } = await supabase.from("budgets").insert({
    profile_id,
    category_id: finalCategoryId,
    amount,
    yyyymm
  });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  // 戻る
  return NextResponse.redirect(new URL("/budgets", req.url));
}

