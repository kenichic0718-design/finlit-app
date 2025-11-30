// app/learn/pretest/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import ExamClient, { type ExamAnswerDetail } from "../_ExamClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PretestPage() {
  const supabase = supabaseServer();

  // ログインユーザー取得
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect("/login");
  }

  // すでに事前テストを受けているか確認（1人1回・mode = 'pre'）
  const { count, error: countError } = await supabase
    .from("exam_results")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .eq("mode", "pre");

  if (countError) {
    console.error("[pretest] exam_results count error:", countError);
  }

  const alreadyTaken = (count ?? 0) > 0;

  if (alreadyTaken) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-50">事前テスト</h2>
        <p className="text-sm text-zinc-200">
          あなたの事前テストは完了済みでした。
          このスコアは後ほど学習結果として利用されます。
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

    // 念のためここでも「1人1回」を保証
    const { count, error: countError } = await supabase
      .from("exam_results")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .eq("mode", "pre");

    if (countError) {
      console.error("[pretest] insert-side count error:", countError);
    }

    if ((count ?? 0) > 0) {
      // すでに記録がある場合は二重登録しない
      return;
    }

    const { error: insertError } = await supabase.from("exam_results").insert([
      {
        profile_id: user.id,
        mode: "pre",
        score,
        total,
        detail_json: details, // ★ ここに JSONB で保存
      },
    ]);

    if (insertError) {
      console.error("[pretest] insert error", insertError);
    }
  }

  // 未受験ユーザーには 20問テスト画面を表示
  return <ExamClient mode="pre" kind="pre" onFinish={handleFinish} />;
}

