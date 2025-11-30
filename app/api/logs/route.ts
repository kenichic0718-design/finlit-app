// app/api/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getCurrentProfileId } from "@/app/_utils/getCurrentProfileId";

type Kind = "expense" | "income";

type LogItem = {
  id: string;
  categoryId: string;
  amountInt: number;
  memo: string | null;
  occurredOn: string; // "YYYY-MM-DD"
  createdAt: string;
};

type CategoryLogs = {
  categoryId: string;
  categoryName: string;
  kind: Kind;
  totalAmountInt: number;
  logs: LogItem[];
};

type LogsResponse = {
  ok: true;
  ym: string;
  kind: Kind;
  summary: {
    totalAmountInt: number;
    budgetTotalAmountInt: number;
    diffAmountInt: number;
  };
  categories: {
    categoryId: string;
    categoryName: string;
    kind: Kind;
    totalAmountInt: number;
    logs: LogItem[];
  }[];
  // 互換用（旧クライアント向け）
  items?: LegacyItem[];
};

type ErrorResponse = { ok: false; error?: string; detail?: unknown };

type LegacyItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  kind: Kind;
  amountInt: number;
  memo: string | null;
  occurredOn: string;
  createdAt: string;
};

function jsonOk(body: LogsResponse | ErrorResponse): NextResponse {
  return NextResponse.json(body);
}

function jsonError(
  status: number,
  message: string,
  detail?: unknown
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { ok: false, error: message, detail },
    { status }
  );
}

function parseYm(ym: string | null): string | null {
  if (!ym) return null;
  if (!/^\d{4}-\d{2}$/.test(ym)) return null;
  return ym;
}

function getYmRange(ym: string): { from: string; to: string } {
  const [yStr, mStr] = ym.split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1); // 翌月1日

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);
  return { from: fromStr, to: toStr };
}

function normalizeKind(kindParam: string | null): Kind | null {
  if (kindParam === "expense" || kindParam === "income") {
    return kindParam;
  }
  return null;
}

/**
 * GET /api/logs?ym=YYYY-MM&kind=expense|income
 *
 * - 指定年月・種別のログ一覧＋カテゴリごとの集計＋予算との比較を返す
 */
export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const profileId = await getCurrentProfileId();
  if (!profileId) {
    return jsonError(401, "認証情報が取得できません。");
  }

  const { searchParams } = new URL(req.url);
  const ymParam = parseYm(searchParams.get("ym"));
  const kindParam = normalizeKind(searchParams.get("kind"));

  if (!ymParam || !kindParam) {
    return jsonError(400, "ym（YYYY-MM）とkind（expense|income）は必須です。");
  }

  const { from, to } = getYmRange(ymParam);
  const kind = kindParam;

  try {
    // カテゴリ（設定ページの並び順そのまま）
    const {
      data: categories,
      error: catErr,
    } = await supabase
      .from("categories")
      .select("id, name, kind, position, created_at")
      .eq("profile_id", profileId)
      .eq("kind", kind)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (catErr) {
      return jsonError(500, "カテゴリの取得に失敗しました。", catErr.message);
    }

    const categoryIds = categories?.map((c) => c.id as string) ?? [];

    // ログ（logs）
    const {
      data: logs,
      error: logsErr,
    } = await supabase
      .from("logs")
      .select("id, category_id, amount, memo, happened_on, created_at")
      .eq("profile_id", profileId)
      .eq("kind", kind)
      .gte("happened_on", from)
      .lt("happened_on", to)
      .in(
        "category_id",
        categoryIds.length > 0
          ? categoryIds
          : ["00000000-0000-0000-0000-000000000000"]
      )
      .order("happened_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (logsErr) {
      return jsonError(500, "記録の取得に失敗しました。", logsErr.message);
    }

    // 予算（budgets）
    const {
      data: budgets,
      error: budgetsErr,
    } = await supabase
      .from("budgets")
      .select("category_id, amount_int, month")
      .eq("profile_id", profileId)
      .eq("month", ymParam);

    if (budgetsErr) {
      return jsonError(500, "予算の取得に失敗しました。", budgetsErr.message);
    }

    const logsByCategory = new Map<string, LogItem[]>();
    const budgetsByCategory = new Map<
      string,
      { amountInt: number; categoryId: string }
    >();

    // ログをカテゴリごとにグループ化
    for (const row of logs ?? []) {
      const categoryId = row.category_id as string;
      if (!categoryId) continue;

      const item: LogItem = {
        id: row.id as string,
        categoryId,
        amountInt: Number(row.amount) || 0,
        memo: row.memo as string | null,
        occurredOn: row.happened_on as string,
        createdAt: row.created_at as string,
      };

      const list = logsByCategory.get(categoryId) ?? [];
      list.push(item);
      logsByCategory.set(categoryId, list);
    }

    // 予算をカテゴリごとに集計
    for (const row of budgets ?? []) {
      const categoryId = row.category_id as string | null;
      if (!categoryId) continue;

      const current = budgetsByCategory.get(categoryId) ?? {
        amountInt: 0,
        categoryId,
      };
      const next = {
        amountInt: current.amountInt + (Number(row.amount_int) || 0),
        categoryId,
      };
      budgetsByCategory.set(categoryId, next);
    }

    const categoryPayload: CategoryLogs[] = (categories ?? []).map((c) => {
      const cid = c.id as string;
      const logsForCategory = logsByCategory.get(cid) ?? [];

      const totalAmountInt = logsForCategory.reduce(
        (sum, item) => sum + item.amountInt,
        0
      );

      return {
        categoryId: cid,
        categoryName: c.name as string,
        kind: c.kind as Kind,
        totalAmountInt,
        logs: logsForCategory,
      };
    });

    // サマリ計算
    const totalAmountInt = categoryPayload.reduce(
      (sum, c) => sum + c.totalAmountInt,
      0
    );

    const budgetTotalAmountInt = categoryPayload.reduce((sum, c) => {
      const b = budgetsByCategory.get(c.categoryId);
      return sum + (b?.amountInt ?? 0);
    }, 0);

    const diffAmountInt = totalAmountInt - budgetTotalAmountInt;

    // 互換用 items（旧形式）
    const legacyItems: LegacyItem[] = [];
    for (const c of categoryPayload) {
      for (const log of c.logs) {
        legacyItems.push({
          id: log.id,
          categoryId: c.categoryId,
          categoryName: c.categoryName,
          kind: c.kind,
          amountInt: log.amountInt,
          memo: log.memo,
          occurredOn: log.occurredOn,
          createdAt: log.createdAt,
        });
      }
    }

    const body: LogsResponse = {
      ok: true,
      ym: ymParam,
      kind,
      summary: {
        totalAmountInt,
        budgetTotalAmountInt,
        diffAmountInt,
      },
      categories: categoryPayload,
      items: legacyItems,
    };

    return jsonOk(body);
  } catch (err: any) {
    return jsonError(500, "予期せぬエラーが発生しました。", err?.message ?? err);
  }
}

/**
 * POST /api/logs
 *
 * body: {
 *   kind: "expense" | "income";
 *   categoryId: string;
 *   amountInt: number;
 *   memo?: string | null;
 *   occurredOn: string; // "YYYY-MM-DD"
 * }
 */
export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const profileId = await getCurrentProfileId();
  if (!profileId) {
    return jsonError(401, "認証情報が取得できません。");
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "JSON のパースに失敗しました。");
  }

  const kindParam = normalizeKind(body.kind);
  const categoryId = (body.categoryId ?? "").trim();
  const memo =
    body.memo === null || body.memo === undefined
      ? null
      : String(body.memo).trim();
  const occurredOn = String(body.occurredOn ?? "").trim();
  const amountInt = Number(body.amountInt);

  if (!kindParam) {
    return jsonError(400, "kind は expense|income で指定してください。");
  }
  if (!categoryId) {
    return jsonError(400, "categoryId が指定されていません。");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) {
    return jsonError(
      400,
      "occurredOn は YYYY-MM-DD 形式で指定してください。"
    );
  }
  if (!Number.isFinite(amountInt)) {
    return jsonError(400, "amountInt は数値で指定してください。");
  }

  const kind = kindParam;

  // カテゴリがそのユーザーの is_active なカテゴリかチェック
  const {
    data: catRow,
    error: catCheckErr,
  } = await supabase
    .from("categories")
    .select("id, is_active")
    .eq("profile_id", profileId)
    .eq("id", categoryId)
    .maybeSingle();

  if (catCheckErr) {
    return jsonError(500, "カテゴリの確認に失敗しました。", catCheckErr.message);
  }
  if (!catRow || catRow.is_active === false) {
    return jsonError(400, "このカテゴリには記録できません。");
  }

  const { data, error } = await supabase
    .from("logs")
    .insert({
      profile_id: profileId,
      kind,
      category_id: categoryId,
      amount: amountInt,
      memo,
      happened_on: occurredOn,
    })
    .select("id, category_id, amount, memo, happened_on, created_at")
    .maybeSingle();

  if (error || !data) {
    return jsonError(500, "記録の保存に失敗しました。", error?.message);
  }

  const item: LogItem = {
    id: data.id as string,
    categoryId: data.category_id as string,
    amountInt: Number(data.amount) || 0,
    memo: data.memo as string | null,
    occurredOn: data.happened_on as string,
    createdAt: data.created_at as string,
  };

  // --- ここから：テレメトリ log_created を記録 --------------------
  try {
    await supabase.from("telemetry_events").insert({
      profile_id: profileId,
      event_type: "log_created",
      detail: {
        kind,
        categoryId,
        hasMemo: memo !== null && memo !== "",
        occurredOn,
      },
      created_at: new Date().toISOString(),
    });
  } catch {
    // テレメトリに失敗しても、本体のレスポンスは成功させる
  }
  // --- ここまで追加 -------------------------------------------------

  return NextResponse.json(
    {
      ok: true,
      item,
    },
    { status: 200 }
  );
}

