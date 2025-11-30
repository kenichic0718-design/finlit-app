"use client";

// app/learn/quiz/Client.tsx

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  QUESTION_BANK,
  TOPIC_LABELS,
  type Quiz,
  type QuizTopicId,
} from "./questions";
import { trackEvent } from "@/lib/telemetry"; // ★追加：テレメトリ

type Step = "select" | "quiz" | "finished";

// /api/learn/stats の byTopic に合わせた型
type TopicRow = {
  topic: string;
  correct: number;
  total: number;
  sessions: number;
  rate: number;
};

type StatsOk = {
  ok: true;
  // ここは将来的に使うかもしれないので optional にしておく
  todaySolved?: number;
  todayCorrect?: number;
  todayRate?: number;
  byTopic: TopicRow[];
  timeline?: { date: string; solved: number; correct: number }[];
};

type StatsResp = StatsOk | { ok: false; error: string };

const QUIZ_LENGTH = 10;

const TOPIC_CONFIG: { id: QuizTopicId; label: string; description: string }[] = [
  {
    id: "budget",
    label: TOPIC_LABELS.budget,
    description:
      "家計簿・固定費・サブスクなど、毎月のお金の出入りを整える基礎。",
  },
  {
    id: "loan",
    label: TOPIC_LABELS.loan,
    description:
      "クレジットカード、リボ払い、ローンや奨学金の借り方・返し方。",
  },
  {
    id: "inflation",
    label: TOPIC_LABELS.inflation,
    description: "物価上昇と金利の関係。お金の実質的な価値の変化を考える。",
  },
  {
    id: "invest",
    label: TOPIC_LABELS.invest,
    description: "貯蓄と投資の違い、長期・積立・分散投資の考え方。",
  },
  {
    id: "scholar",
    label: TOPIC_LABELS.scholar,
    description: "奨学金制度と返還、生活設計とのバランスを考える。",
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions(topics: QuizTopicId[]): Quiz[] {
  const pool =
    topics.length === 0
      ? QUESTION_BANK
      : QUESTION_BANK.filter((q) => topics.includes(q.topic));
  const shuffled = shuffle(pool);
  return shuffled.slice(0, Math.min(QUIZ_LENGTH, shuffled.length));
}

// stats.byTopic から指定トピックの行を取り出す
function getTopicRow(stats: StatsOk | null, label: string): TopicRow | null {
  if (!stats) return null;
  return stats.byTopic.find((r) => r.topic === label) ?? null;
}

export default function Client() {
  const [step, setStep] = useState<Step>("select");
  const [selectedTopics, setSelectedTopics] = useState<QuizTopicId[]>([]);

  const [stats, setStats] = useState<StatsOk | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Quiz[]>([]);
  const [cursor, setCursor] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const current = questions[cursor];

  const correctCount = useMemo(() => {
    return questions.reduce((acc, q, idx) => {
      const a = answers[idx];
      if (a === q.answerIndex) return acc + 1;
      return acc;
    }, 0);
  }, [answers, questions]);

  useEffect(() => {
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStats() {
    setStatsLoading(true);
    setStatsError(null);
    try {
      // 期間は「直近30日」で統一
      const res = await fetch("/api/learn/stats?days=30", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data: StatsResp = await res.json();
      if (!data.ok) {
        setStats(null);
        setStatsError((data as any).error ?? "統計情報の取得に失敗しました。");
      } else {
        setStats(data);
      }
    } catch (e: any) {
      setStats(null);
      setStatsError(e?.message ?? "統計情報の取得に失敗しました。");
    } finally {
      setStatsLoading(false);
    }
  }

  function toggleTopic(id: QuizTopicId) {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function startQuiz() {
    const qs = pickQuestions(selectedTopics);
    setQuestions(qs);
    setAnswers(Array(qs.length).fill(null));
    setCursor(0);
    setStep("quiz");

    // ★追加：ミニクイズ開始のテレメトリ
    const topicsForTelemetry =
      selectedTopics.length === 0 ? ["all"] : selectedTopics;
    void trackEvent("quiz_mini_started", {
      topics: topicsForTelemetry,
      totalCount: qs.length,
    });
  }

  async function logAnswer(
    question: Quiz,
    chosenIndex: number,
    isCorrect: boolean,
  ) {
    try {
      await fetch("/api/learn/answer", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: question.id,
          chosen_index: chosenIndex,
          is_correct: isCorrect,
        }),
      });
    } catch (e) {
      console.error("[quiz] failed to log answer", e);
    }
  }

  function handleChoose(idx: number) {
    if (!current) return;

    setAnswers((prev) => {
      const next = [...prev];
      const alreadyAnswered = next[cursor] !== null && next[cursor] !== undefined;

      // 既に回答済みなら何もしない
      if (alreadyAnswered) {
        return next;
      }

      next[cursor] = idx;

      const isCorrect = idx === current.answerIndex;
      void logAnswer(current, idx, isCorrect);

      return next;
    });
  }

  function handleNext() {
    if (cursor + 1 < questions.length) {
      setCursor((c) => c + 1);
    } else {
      setStep("finished");

      // ★追加：ミニクイズ完了のテレメトリ
      const topicsForTelemetry =
        selectedTopics.length === 0 ? ["all"] : selectedTopics;
      void trackEvent("quiz_mini_completed", {
        topics: topicsForTelemetry,
        correctCount,
        totalCount: questions.length,
      });

      // 結果画面を見たあとにトピック選択に戻った時、
      // 進捗バーを最新にするため再取得
      void loadStats();
    }
  }

  function handleRestartSameTopics() {
    startQuiz();
  }

  function handleBackToSelect() {
    setStep("select");
    setQuestions([]);
    setAnswers([]);
    setCursor(0);
    void loadStats();
  }

  const currentTopicLabel =
    current && TOPIC_LABELS[current.topic]
      ? TOPIC_LABELS[current.topic]
      : undefined;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-50">ミニクイズ</h1>
        <Link
          href="/learn"
          className="text-sm text-zinc-400 underline underline-offset-4 hover:text-zinc-200"
        >
          ← 学ぶ に戻る
        </Link>
      </div>

      {step === "select" && (
        <section className="space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">
            気になるトピックを選んで 10 問のクイズに挑戦します。
            結果は学習統計に反映され、トピックごとの正答率も蓄積されます。
          </p>

          {statsError && (
            <div className="rounded-2xl border border-rose-400/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
              統計情報の取得に失敗しました：{statsError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {TOPIC_CONFIG.map((t) => {
              const row = getTopicRow(stats, t.label);
              // API は total を返しているのでここを参照する
              const solved = row?.total ?? 0;
              const correct = row?.correct ?? 0;
              const rate =
                solved > 0 ? Math.round((correct / solved) * 100) : 0;
              const selected = selectedTopics.includes(t.id);

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTopic(t.id)}
                  className={[
                    "flex flex-col rounded-2xl border px-4 py-3 text-left transition",
                    selected
                      ? "border-emerald-400/70 bg-emerald-500/10"
                      : "border-zinc-700/60 bg-zinc-900/60 hover:border-zinc-500",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-zinc-50">
                        {t.label}
                      </div>
                      <p className="mt-1 text-xs text-zinc-300">
                        {t.description}
                      </p>
                    </div>
                    <div
                      className={[
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                        selected
                          ? "border-emerald-400/80 bg-emerald-400/20 text-emerald-100"
                          : "border-zinc-600 bg-zinc-800 text-zinc-200",
                      ].join(" ")}
                    >
                      {selected ? "選択中" : "タップで選択"}
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-zinc-400">
                    直近30日 正解 {correct} / 解答 {solved}
                    {solved > 0 && <>（{rate}%）</>}
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-800">
                    <div
                      className="h-1.5 rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-zinc-400">
              ※ トピック未選択の場合は「全トピック」から出題します。
            </div>
            <button
              type="button"
              onClick={startQuiz}
              disabled={statsLoading || QUESTION_BANK.length === 0}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
            >
              {statsLoading ? "読み込み中…" : "この内容でクイズを始める"}
            </button>
          </div>
        </section>
      )}

      {step === "quiz" && current && (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <div>
              問 {cursor + 1} / {questions.length}
            </div>
            {currentTopicLabel && <div>{currentTopicLabel}</div>}
          </div>

          <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/70 p-4">
            <p className="text-sm font-medium text-zinc-50">
              {current.question}
            </p>
          </div>

          <ul className="space-y-2">
            {current.choices.map((choice, idx) => {
              const selected = answers[cursor] === idx;
              const answered =
                answers[cursor] !== null && answers[cursor] !== undefined;
              const isCorrectChoice = idx === current.answerIndex;

              let borderClass = "border-zinc-700/70";
              let bgClass = "bg-zinc-900/70";
              let textClass = "text-zinc-100";

              if (answered) {
                // 回答後は「正解は常に緑」「誤答として選んだものだけ赤」
                if (isCorrectChoice) {
                  borderClass = "border-emerald-400/80";
                  bgClass = "bg-emerald-500/15";
                  textClass = "text-emerald-100";
                } else if (selected && !isCorrectChoice) {
                  borderClass = "border-rose-400/80";
                  bgClass = "bg-rose-500/10";
                  textClass = "text-rose-100";
                }
              } else if (selected) {
                borderClass = "border-emerald-300/80";
                bgClass = "bg-emerald-500/10";
              }

              return (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleChoose(idx)}
                    disabled={answered} // 回答後は押せない
                    className={[
                      "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                      borderClass,
                      bgClass,
                      textClass,
                    ].join(" ")}
                  >
                    {choice}
                  </button>
                </li>
              );
            })}
          </ul>

          {answers[cursor] !== null && answers[cursor] !== undefined && (
            <div className="mt-3 rounded-2xl bg-zinc-800/80 p-4 text-xs text-zinc-100">
              {answers[cursor] === current.answerIndex ? (
                <p className="font-semibold text-emerald-300">正解です！</p>
              ) : (
                <p className="font-semibold text-rose-300">
                  不正解です。ここで確認しておきましょう。
                </p>
              )}
              <p className="mt-2 text-zinc-100">{current.explanation}</p>
              {current.sources.length > 0 && (
                <div className="mt-3 space-y-1 text-[11px] text-zinc-300">
                  {current.sources.map((s, i) => (
                    <div key={i}>
                      出典：{" "}
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4 hover:text-zinc-50"
                      >
                        {s.title}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-center sm:justify-end">
            <button
              type="button"
              onClick={handleNext}
              disabled={
                answers[cursor] === null || answers[cursor] === undefined
              }
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
            >
              {cursor + 1 < questions.length ? "次の問題へ" : "結果を見る"}
            </button>
          </div>
        </section>
      )}

      {step === "finished" && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/70 p-4">
            <h2 className="text-lg font-semibold text-zinc-50">
              おつかれさまでした！
            </h2>
            <p className="mt-2 text-sm text-zinc-200">
              今回は {questions.length} 問中{" "}
              <span className="font-semibold text-emerald-300">
                {correctCount} 問正解
              </span>
              でした。
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              正誤データは蓄積され、トピックごとの理解度の変化として学習統計に反映されます。
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleRestartSameTopics}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-50 hover:bg-zinc-800"
            >
              同じトピックでもう一度解く
            </button>
            <button
              type="button"
              onClick={handleBackToSelect}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-50 hover:bg-zinc-800"
            >
              トピック選択に戻る
            </button>
            <Link
              href="/learn/stats"
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20"
            >
              学習統計を見る
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

