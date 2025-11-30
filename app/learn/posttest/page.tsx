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

  // すでに事後テストを受けているか確認（1人1回・mode = 'post'）
  const { count, error: countError } = await supabase
    .from("exam_results")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .eq("mode", "post");

  if (countError) {
    console.error("[posttest] exam_results count error:", countError);
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

    // ここでも 1人1回 を保証
    const { count, error: countError } = await supabase
      .from("exam_results")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .eq("mode", "post");

    if (countError) {
      console.error("[posttest] insert-side count error:", countError);
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
        detail_json: details, // ★ ここに JSONB で保存
      },
    ]);

    if (insertError) {
      console.error("[posttest] insert error", insertError);
    }
  }

  // 事後テストでは、ExamClient 側でスコア表示あり
  return <ExamClient mode="post" kind="post" onFinish={handleFinish} />;
}

