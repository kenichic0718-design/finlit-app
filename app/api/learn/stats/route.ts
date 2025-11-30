// app/api/learn/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getCurrentProfileId } from "@/app/_utils/getCurrentProfileId";
import {
  QUESTION_BANK,
  TOPIC_LABELS,
  QuizTopicId,
} from "@/app/learn/quiz/questions";

/**
 * question_id → topicId(budget / loan / ...) の逆引きマップ
 * QUESTION_BANK は静的なので、モジュールロード時に 1 回だけ作る
 */
const QUESTION_TO_TOPIC = new Map<string, QuizTopicId>();
for (const q of QUESTION_BANK) {
  QUESTION_TO_TOPIC.set(q.id, q.topic);
}

/**
 * ミニクイズ用の統計情報 API
 *
 * - クエリ: ?days=60 など（集計対象の日数）
 * - 戻り値:
 *   {
 *     ok: true,
 *     byTopic: Array<{
 *       topic: string;          // 日本語ラベル（例: "家計管理・サブスク"）
 *       correct: number;        // 期間内の正解数
 *       total: number;          // 期間内の解いた問題数
 *       sessions: number;       // 期間内に解いた問題数（暫定で 1問=1カウント）
 *       rate: number;           // 正答率 0〜1
 *     }>
 *   }
 *
 * RLS 前提:
 * - quiz_results.profile_id = auth.uid()
 */
export async function GET(req: NextRequest) {
  try {
    const profileId = await getCurrentProfileId();
    if (!profileId) {
      return NextResponse.json(
        { ok: false, error: "ログインユーザーが見つかりません。" },
        { status: 401 }
      );
    }

    const supabase = supabaseServer();

    // days パラメータ（デフォルト 60 日・1〜365 の範囲にクランプ）
    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get("days");
    const rawDays = Number(daysParam ?? "60");
    const days = Number.isFinite(rawDays)
      ? Math.min(365, Math.max(1, Math.floor(rawDays)))
      : 60;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromIso = fromDate.toISOString();

    // 期間内の quiz_results を取得
    // ※ 実テーブルのカラム名に合わせる（question_id / is_correct / created_at）
    const { data, error } = await supabase
      .from("quiz_results")
      .select("question_id, is_correct, created_at")
      .eq("profile_id", profileId)
      .gte("created_at", fromIso)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("quiz_results fetch error:", error);
      return NextResponse.json(
        {
          ok: false,
          error: error.message ?? "クイズ統計の取得に失敗しました。",
        },
        { status: 500 }
      );
    }

    type QuizResultRow = {
      question_id: string;
      is_correct: boolean | null;
      created_at: string;
    };

    const rows = (data ?? []) as QuizResultRow[];

    // topic（日本語ラベル）ごとに集計
    const byTopicMap = new Map<
      string,
      { correct: number; total: number; sessions: number }
    >();

    for (const row of rows) {
      const topicId = QUESTION_TO_TOPIC.get(row.question_id);
      const topicLabel =
        (topicId && TOPIC_LABELS[topicId]) || "不明なトピック";

      const stat =
        byTopicMap.get(topicLabel) ?? {
          correct: 0,
          total: 0,
          sessions: 0,
        };

      stat.total += 1; // 1問解いた
      stat.sessions += 1; // 暫定: 1問 = 1セッションとしてカウント

      if (row.is_correct) {
        stat.correct += 1;
      }

      byTopicMap.set(topicLabel, stat);
    }

    const byTopic = Array.from(byTopicMap.entries()).map(
      ([topic, { correct, total, sessions }]) => ({
        topic,
        correct,
        total,
        sessions,
        rate: total > 0 ? correct / total : 0,
      })
    );

    return NextResponse.json({ ok: true, byTopic });
  } catch (e: any) {
    console.error("GET /api/learn/stats error:", e);
    return NextResponse.json(
      {
        ok: false,
        error:
          e?.message ??
          "クイズ統計の取得中に予期しないエラーが発生しました。",
      },
      { status: 500 }
    );
  }
}

