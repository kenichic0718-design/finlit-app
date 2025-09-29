// /app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";

// ※あなたのプロジェクトのヘルパに合わせて import を調整してください。
//   例: "@/app/_supabase/route" で createRouteHandlerClient を返す関数があるはずです。
import { getSupabaseRoute } from "@/app/_supabase/route";

export const dynamic = "force-dynamic";

type Kind = "expense" | "income";
type Category = { id: string; name: string; kind: Kind };

const GUEST_EXPENSE: Category[] = [
  { id: "food", name: "食費", kind: "expense" },
  { id: "transport", name: "交通", kind: "expense" },
  { id: "entertainment", name: "娯楽", kind: "expense" },
];
const GUEST_INCOME: Category[] = [
  { id: "salary", name: "給与", kind: "income" },
  { id: "allowance", name: "お小遣い", kind: "income" },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kindParam = (searchParams.get("kind") || "expense") as Kind;

    // Supabase（認証取得）
    const supabase = getSupabaseRoute();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user ?? null;

    // 未ログイン → ゲストカテゴリ
    if (!user) {
      const items =
        kindParam === "income" ? GUEST_INCOME : GUEST_EXPENSE;

      // ←←← ここが“後方互換”の肝。items と data の両方を返す
      return NextResponse.json({
        ok: true,
        guest: true,
        items,
        data: items, // 旧コードが json.data を読んでも動く
      });
    }

    // ログイン済み → DB から取得
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,kind")
      .eq("kind", kindParam)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // ここも後方互換 payload
    return NextResponse.json({
      ok: true,
      items: (data || []) as Category[],
      data: (data || []) as Category[],
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}

