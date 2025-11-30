// app/api/learn/exam-results/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getCurrentProfileId } from "@/app/_utils/getCurrentProfileId";

/**
 * exam_results API
 * - 事前テスト(pre)・事後テスト(post) の保存を行う
 * - 各ユーザー・各kind（pre/post）ごとに1回のみ受験可能
 */
export async function POST(req: NextRequest) {
  try {
    const profileId = await getCurrentProfileId();
    if (!profileId) {
      return NextResponse.json({ ok: false, error: "未ログインです。" }, { status: 401 });
    }

    const supabase = supabaseServer();
    const body = await req.json();
    const { kind, answers, score, total } = body ?? {};

    if (!["pre", "post"].includes(kind)) {
      return NextResponse.json(
        { ok: false, error: "`kind` は 'pre' または 'post' で指定してください。" },
        { status: 400 }
      );
    }

    // --- 二重受験チェック ---
    const { data: existing, error: selectError } = await supabase
      .from("exam_results")
      .select("id, created_at")
      .eq("profile_id", profileId)
      .eq("kind", kind)
      .maybeSingle();

    if (selectError) {
      console.error("exam_results select error:", selectError);
      return NextResponse.json(
        { ok: false, error: "受験履歴の確認に失敗しました。" },
        { status: 500 }
      );
    }

    if (existing) {
      // 二重受験をブロック
      return NextResponse.json(
        {
          ok: false,
          error: "LIMIT_REACHED",
          message: `この${kind === "pre" ? "事前" : "事後"}テストはすでに受験済みです。`,
        },
        { status: 403 }
      );
    }

    // --- 登録処理 ---
    const { data, error: insertError } = await supabase
      .from("exam_results")
      .insert({
        profile_id: profileId,
        kind,
        answers: answers ?? [],
        score: Number(score ?? 0),
        total: Number(total ?? 0),
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("exam_results insert error:", insertError);
      return NextResponse.json(
        { ok: false, error: "INSERT_FAILED", detail: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    console.error("POST /api/learn/exam-results error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "予期せぬエラーが発生しました。" },
      { status: 500 }
    );
  }
}

/**
 * GET: 結果一覧取得（必要に応じて使用）
 */
export async function GET(req: NextRequest) {
  try {
    const profileId = await getCurrentProfileId();
    if (!profileId) {
      return NextResponse.json({ ok: false, error: "未ログインです。" }, { status: 401 });
    }

    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("exam_results")
      .select("id, kind, score, total, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("exam_results fetch error:", error);
      return NextResponse.json(
        { ok: false, error: "FETCH_FAILED", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, items: data });
  } catch (e: any) {
    console.error("GET /api/learn/exam-results error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "予期せぬエラーが発生しました。" },
      { status: 500 }
    );
  }
}

