// app/api/budgets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getCurrentProfileId } from "@/app/_utils/getCurrentProfileId";

type BudgetRow = {
  id: number | string;
  profile_id: string;
  month: string;
  category_id: string | null;
  amount_int: number | null;
};

type CategoryRow = {
  id: string;
  name: string | null;
  kind: "expense" | "income" | null;
};

function jsonOk(body: unknown, status?: number) {
  return NextResponse.json(body, status ? { status } : undefined);
}

function jsonError(status: number, error: string, detail?: string) {
  return NextResponse.json(
    {
      ok: false,
      error,
      detail,
    },
    { status }
  );
}

// GET /api/budgets?ym=YYYY-MM&kind=expense|income
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ym = url.searchParams.get("ym") ?? url.searchParams.get("month");
  const kindFilter = url.searchParams.get("kind"); // "expense" | "income" | null

  if (!ym) {
    return jsonError(400, "missing_ym", "`ym` (YYYY-MM) が指定されていません。");
  }

  const profileId = await getCurrentProfileId();
  if (!profileId) {
    // 未ログイン時はエラーではなく空配列で返す（既存仕様と合わせる）
    return jsonOk({ ok: true, items: [] });
  }

  const supabase = supabaseServer();

  // budgets
  const { data: budgets, error: budgetsError } = await supabase
    .from("budgets")
    .select("id, profile_id, month, category_id, amount_int")
    .eq("profile_id", profileId)
    .eq("month", ym)
    .order("category_id", { ascending: true });

  if (budgetsError) {
    console.error("[/api/budgets] select budgets error", budgetsError);
    return jsonError(500, "select_failed", budgetsError.message);
  }

  // categories（★ is_active = true のみ）
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, kind, is_active")
    .eq("profile_id", profileId)
    .eq("is_active", true);

  if (categoriesError) {
    console.error("[/api/budgets] select categories error", categoriesError);
    return jsonError(500, "categories_failed", categoriesError.message);
  }

  const catMap = new Map<string, CategoryRow>();
  (categories ?? []).forEach((c: any) => {
    catMap.set(c.id, {
      id: c.id,
      name: c.name ?? null,
      kind: (c.kind ?? null) as "expense" | "income" | null,
    });
  });

  let items = (budgets ?? []).map((b: BudgetRow) => {
    const cat = b.category_id ? catMap.get(b.category_id) : undefined;
    return {
      id: b.id,
      month: b.month,
      category_id: b.category_id,
      amount_int: b.amount_int ?? 0,
      kind: cat?.kind ?? null,
      category_name: cat?.name ?? null,
    };
  });

  if (kindFilter === "expense" || kindFilter === "income") {
    items = items.filter((i) => i.kind === kindFilter);
  }

  return jsonOk({ ok: true, items });
}

// POST /api/budgets
// body: { month: "YYYY-MM", category_id: "uuid", amount_int: number }
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "JSON ボディが不正です。");
  }

  const month: string = String(body.month ?? body.ym ?? "").trim();
  const categoryId: string = String(body.category_id ?? "").trim();
  const amountRaw = body.amount_int ?? body.amount;
  const amountInt = Number(amountRaw);

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return jsonError(
      400,
      "invalid_month",
      "`month` は YYYY-MM 形式で指定してください。"
    );
  }
  if (!categoryId) {
    return jsonError(
      400,
      "missing_category",
      "`category_id` が指定されていません。"
    );
  }
  if (!Number.isFinite(amountInt)) {
    return jsonError(
      400,
      "invalid_amount",
      "`amount_int` は数値で指定してください。"
    );
  }

  const profileId = await getCurrentProfileId();
  if (!profileId) {
    return jsonError(401, "not_authenticated", "ログインが必要です。");
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      {
        profile_id: profileId,
        month,
        category_id: categoryId,
        amount_int: amountInt,
      },
      {
        // 事前に profile_id,month,category_id の UNIQUE 制約を貼っている前提
        onConflict: "profile_id,month,category_id",
      }
    )
    .select("id, profile_id, month, category_id, amount_int")
    .single();

  if (error) {
    console.error("[/api/budgets] upsert error", error);
    return jsonError(500, "upsert_failed", error.message);
  }

  // --- ここから：テレメトリ budget_saved を記録 --------------------
  try {
    // 予算のカテゴリ種別（expense/income）を取得（失敗しても無視）
    const { data: catRow } = await supabase
      .from("categories")
      .select("kind")
      .eq("profile_id", profileId)
      .eq("id", categoryId)
      .maybeSingle();

    await supabase.from("telemetry_events").insert({
      profile_id: profileId,
      event_type: "budget_saved",
      detail: {
        month,
        categoryId,
        amountInt,
        kind: catRow?.kind ?? null,
      },
      created_at: new Date().toISOString(),
    });
  } catch {
    // テレメトリに失敗しても、本体のレスポンスは成功させる
  }
  // --- ここまで追加 -------------------------------------------------

  return jsonOk({
    ok: true,
    item: data,
  });
}

