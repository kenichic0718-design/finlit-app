// app/learn/required/RequiredClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase/client";

interface Props {
  user: User;
}

/**
 * クライアント側で5問出題・解答・保存を制御
 */
export default function RequiredClient({ user }: Props) {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [completed, setCompleted] = useState(false);

  // 今日の5問を読み込み
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("required_questions")
        .select("*")
        .limit(5);

      if (!error && data) setQuestions(data);
      setLoading(false);
    }
    load();
  }, [supabase]);

  // 回答送信
  async function handleSubmit() {
    const correctCount = questions.filter(
      (q, i) => q.correct_choice === answers[i]
    ).length;

    await supabase.from("required_results").insert({
      profile_id: user.id,
      date_key: new Date().toISOString().split("T")[0],
      score: correctCount,
    });

    sessionStorage.setItem("required_completed", "true");
    setCompleted(true);
  }

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p>読み込み中...</p>
      </div>
    );

  if (completed)
    return (
      <div className="flex flex-col items-center h-[60vh] justify-center gap-3">
        <p className="text-lg">今日の必須5問は完了しました！</p>
        <button
          onClick={() => router.push("/")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          ダッシュボードへ戻る
        </button>
      </div>
    );

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">今日の必須5問</h1>
      {questions.map((q, i) => (
        <div key={i} className="mb-6">
          <p className="font-medium mb-2">
            {i + 1}. {q.text}
          </p>
          {["a", "b", "c", "d"].map((opt) => (
            <label key={opt} className="block">
              <input
                type="radio"
                name={`q${i}`}
                value={opt}
                checked={answers[i] === opt}
                onChange={() =>
                  setAnswers((prev) => ({ ...prev, [i]: opt }))
                }
              />
              <span className="ml-2">{q[`choice_${opt}`]}</span>
            </label>
          ))}
        </div>
      ))}
      <button
        disabled={Object.keys(answers).length < 5}
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        回答を送信
      </button>
    </div>
  );
}
