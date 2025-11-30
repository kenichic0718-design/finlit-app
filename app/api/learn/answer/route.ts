// app/api/learn/answer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getCurrentProfileId } from "@/app/_utils/getCurrentProfileId";

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

/**
 * POST /api/learn/answer
 *
 * body: {
 *   question_id: string;   // 例: "budget_01"
 *   chosen_index: number;  // 0,1,2,...
 *   is_correct: boolean;
 * }
 *
 * → quiz_results に 1 行 INSERT
 */
export async function POST(req: NextRequest) {
  // 1) JSON 取得
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "JSON ボディが不正です。");
  }

  const questionId = String(body.question_id ?? "").trim();
  const chosenIndexRaw = body.chosen_index;
  const isCorrectRaw = body.is_correct;

  // 2) バリデーション
  if (!questionId) {
    return jsonError(
      400,
      "missing_question_id",
      "`question_id` が指定されていません。"
    );
  }

  const chosenIndex = Number(chosenIndexRaw);
  if (!Number.isInteger(chosenIndex) || chosenIndex < 0) {
    return jsonError(
      400,
      "invalid_chosen_index",
      "`chosen_index` は 0 以上の整数で指定してください。"
    );
  }

  const isCorrect = Boolean(isCorrectRaw);

  // 3) ログインユーザー取得（budgets と同じやり方）
  const profileId = await getCurrentProfileId();
  if (!profileId) {
    return jsonError(
      401,
      "UNAUTHENTICATED",
      "ユーザー情報の取得に失敗しました。ログインし直してください。"
    );
  }

  const supabase = supabaseServer();

  // 4) quiz_results へ INSERT
  const { data, error } = await supabase
    .from("quiz_results")
    .insert({
      profile_id: profileId,
      question_id: questionId,
      chosen_index: chosenIndex,
      is_correct: isCorrect,
    })
    .select("id, profile_id, question_id, chosen_index, is_correct, created_at")
    .single();

  if (error) {
    console.error("[/api/learn/answer] insert error", error);
    return jsonError(500, "INSERT_FAILED", "回答の保存に失敗しました。");
  }

  return jsonOk({
    ok: true,
    item: data,
  });
}

