// app/learn/posttest/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import ExamClient, { type ExamAnswerDetail } from "../_ExamClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PosttestPage() {
  const supabase = supabaseServer();

  // ログインユーザー取得
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect("/login");
  }

  // ① 事前テスト（mode = 'pre'）を受けているか確認
  const { count: preCount, error: preCountError } = await supabase
    .from("exam_results")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .eq("mode", "pre");

  if (preCountError) {
    console.error("[posttest] exam_results pre-count error:", preCountError);
  }

  const hasPre = (preCount ?? 0) > 0;

  // 事前テスト未受験なら、事後テストは受けさせない
  if (!hasPre) {
    // 事前テストページへ誘導（ルーティング構造より /learn/pretest を想定）
    redirect("/learn/pretest");
  }

  // ② すでに事後テストを受けているか確認（1人1回・mode = 'post'）
  const { count, error: countError } = await supabase
    .from("exam_results")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .eq("mode", "post");

  if (countError) {
    console.error("[posttest] exam_results post-count error:", countError);
  }

  const alreadyTaken = (count ?? 0) > 0;

  if (alreadyTaken) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-50">事後テスト</h2>
        <p className="text-sm text-zinc-200">
          あなたの事後テストは完了済みでした。
          このスコアは学習結果としてすでに反映されています。
        </p>
        <a
          href="/learn"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20"
        >
          学ぶページへ戻る
        </a>
      </section>
    );
  }

  // 初回ユーザー用：完了時に結果を保存するサーバーアクション
  async function handleFinish(
    score: number,
    total: number,
    details: ExamAnswerDetail[],
  ) {
    "use server";

    const supabase = supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) return;

    // 念のためここでも事前テスト受験を確認（直接呼び出し対策）
    const { count: preCountInner, error: preCountInnerError } = await supabase
      .from("exam_results")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .eq("mode", "pre");

    if (preCountInnerError) {
      console.error(
        "[posttest] insert-side pre-count error:",
        preCountInnerError,
      );
    }

    if ((preCountInner ?? 0) === 0) {
      // 事前テスト未受験なら何も保存しない
      return;
    }

    // ここでも 1人1回 を保証（mode = 'post'）
    const { count, error: countError } = await supabase
      .from("exam_results")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .eq("mode", "post");

    if (countError) {
      console.error("[posttest] insert-side post-count error:", countError);
    }

    if ((count ?? 0) > 0) {
      return;
    }

    const { error: insertError } = await supabase.from("exam_results").insert([
      {
        profile_id: user.id,
        mode: "post",
        score,
        total,
        detail_json: details, // ★ JSONB で保存
      },
    ]);

    if (insertError) {
      console.error("[posttest] insert error", insertError);
    }
  }

  // 事後テストでは、ExamClient 側でスコア表示あり
  return <ExamClient mode="post" kind="post" onFinish={handleFinish} />;
}
