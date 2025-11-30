"use client";

// app/learn/required/Client.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DAILY_QUESTIONS,
  type DailyQuestion,
  type DailyAnswerRecord,
} from "./questions";
import { trackEvent } from "@/lib/telemetry"; // ★ 追加：テレメトリ

type Step = "loading" | "ready" | "quiz" | "finished";

const STORAGE_KEY = "finlit_required_last_daykey";
const RETURN_TO_KEY = "finlit.requiredQuiz.returnTo";
const QUIZ_LENGTH = 5;

// 出題の根拠となっている主な資料（ミニクイズと同じ系統）
const REFERENCE_TEXT =
  "金融庁『基礎から学べる金融ガイド』／金融広報中央委員会『金融リテラシー・マップ』『金融リテラシー調査2022（設問票つき）』などをもとに大学生向けに再構成しています。";

function getDayKey(now: Date): string {
  // AM5:00 で日付を切り替えるため、ローカル時間から5時間引いて日付を算出
  const shifted = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, "0");
  const d = String(shifted.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions(): DailyQuestion[] {
  const shuffled = shuffle(DAILY_QUESTIONS);
  const n = Math.min(QUIZ_LENGTH, shuffled.length);
  return shuffled.slice(0, n);
}

export default function RequiredClient() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("loading");
  const [todayKey, setTodayKey] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DailyQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<DailyAnswerRecord[]>([]);
  const [score, setScore] = useState(0);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 今日分を既に解き終わっているかどうかを localStorage から判定
  useEffect(() => {
    const now = new Date();
    const key = getDayKey(now);
    setTodayKey(key);

    if (typeof window === "undefined") {
      setStep("ready");
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === key) {
      // 既に今日（AM5:00基準）の分を解き終わっている
      setStep("finished");
      return;
    }

    setStep("ready");
  }, []);

  const current = questions[currentIndex] ?? null;
  const isLast = questions.length > 0 && currentIndex === questions.length - 1;

  function handleStart() {
    const qs = pickQuestions();
    setQuestions(qs);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswers([]);
    setScore(0);
    setErrorMsg(null);
    setStep("quiz");

    // ★ 追加：必須5問開始（強制クイズ開始）のテレメトリ
    void trackEvent("quiz_forced_started", {
      phase: "daily",
      totalCount: qs.length,
    });
  }

  function handleChoose(idx: number) {
    if (!current) return;
    if (selectedIndex !== null) return; // 1問につき1回だけ回答

    const isCorrect = idx === current.answerIndex;
    setSelectedIndex(idx);
    setScore((prev) => prev + (isCorrect ? 1 : 0));

    const record: DailyAnswerRecord = {
      questionId: current.id,
      topic: current.topic,
      correctIndex: current.answerIndex,
      selectedIndex: idx,
      isCorrect,
    };

    // 同じ問題IDの記録があれば置き換え
    setAnswers((prev) => {
      const filtered = prev.filter((r) => r.questionId !== record.questionId);
      return [...filtered, record];
    });
  }

  async function finishSession() {
    if (!todayKey) return;
    if (sending) return;

    setSending(true);
    setErrorMsg(null);

    try {
      await fetch("/api/learn/required-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          dayKey: todayKey,
          score,
          total: questions.length,
          answers,
        }),
      });
    } catch (e) {
      console.error("[required] log error", e);
      setErrorMsg(
        "サーバーへの保存に失敗しましたが、今日の分は完了扱いになります。"
      );
    } finally {
      // ★ 追加：必須5問完了（強制クイズ完了）のテレメトリ
      void trackEvent("quiz_forced_completed", {
        phase: "daily",
        correctCount: score,
        totalCount: questions.length,
      });

      setSending(false);

      if (typeof window !== "undefined") {
        // 今日分完了として dayKey を保存
        window.localStorage.setItem(STORAGE_KEY, todayKey);

        // ゲートが保存した「元いたパス」があれば、そこへ戻す
        try {
          const returnTo = window.sessionStorage.getItem(RETURN_TO_KEY);
          if (returnTo && returnTo !== "/learn/required") {
            window.sessionStorage.removeItem(RETURN_TO_KEY);
            router.replace(returnTo);
            return;
          }
        } catch {
          // sessionStorage が使えない場合はそのまま finished 画面へ
        }
      }

      // ここに来た場合は「完了画面」を表示
      setStep("finished");
    }
  }

  function handleNext() {
    if (!current) return;
    if (selectedIndex === null) return;

    if (isLast) {
      void finishSession();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedIndex(null);
  }

  // -------------------- render --------------------

  if (step === "loading" || !todayKey) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <p className="text-sm text-neutral-300">読み込み中です…</p>
      </main>
    );
  }

  if (step === "finished") {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6 space-y-4">
        <h1 className="text-xl font-semibold">今日の必須5問</h1>
        <p className="text-sm text-neutral-200">
          今日（AM5:00基準）の必須問題はすでに解き終わっています。
          明日のAM5:00以降に、また新しい5問が出題されます。
        </p>

        <p className="text-[11px] text-neutral-400 leading-relaxed">
          出典：
          {REFERENCE_TEXT}
        </p>

        <Link
          href="/learn"
          className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full border border-emerald-500/70 bg-emerald-600/20 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30"
        >
          学ぶページへ戻る
        </Link>
      </main>
    );
  }

  if (step === "ready") {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6 space-y-4">
        <h1 className="text-xl font-semibold">今日の必須5問</h1>
        <p className="text-sm text-neutral-200">
          事前・事後テストと同じ基礎テーマから、1日1回だけ出題される5問セットです。
          AM5時を境に1日分が切り替わります。
        </p>
        <p className="text-xs text-neutral-400">
          ※ 1問ごとに正解/不正解と解説が表示されます。今日の分は一度解き終わると再挑戦できません。
        </p>

        <p className="text-[11px] text-neutral-400 leading-relaxed">
          出典：
          {REFERENCE_TEXT}
        </p>

        <button
          type="button"
          onClick={handleStart}
          className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full border border-emerald-500/70 bg-emerald-600/20 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30"
        >
          今日の5問を開始する
        </button>
      </main>
    );
  }

  // step === "quiz"
  if (!current) {
    return null;
  }

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">今日の必須5問</h1>
        <p className="text-xs text-neutral-400">
          問 {currentIndex + 1} / {questions.length}（AM5:00基準の1日1回）
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${
                ((currentIndex + 1) / Math.max(questions.length, 1)) * 100
              }%`,
            }}
          />
        </div>
      </header>

      <section className="space-y-4">
        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/70 p-4">
          <p className="mb-1 text-xs text-emerald-300">テーマ：{current.topic}</p>
          <p className="text-sm font-medium text-zinc-50">
            {current.question}
          </p>
        </div>

        <ul className="space-y-3">
          {current.choices.map((choice, idx) => {
            const isSelected = selectedIndex === idx;
            const isCorrectChoice = idx === current.answerIndex;

            let className =
              "w-full rounded-xl border px-3 py-2 text-left text-sm transition";

            if (selectedIndex === null) {
              className +=
                " border-zinc-700/70 bg-zinc-900/70 text-zinc-100 hover:border-zinc-500";
            } else if (isCorrectChoice) {
              className +=
                " border-emerald-400/80 bg-emerald-500/15 text-emerald-100";
            } else if (isSelected) {
              className +=
                " border-rose-400/80 bg-rose-500/10 text-rose-100";
            } else {
              className +=
                " border-zinc-700/70 bg-zinc-900/70 text-zinc-300 opacity-80";
            }

            return (
              <li key={idx}>
                <button
                  type="button"
                  className={className}
                  onClick={() => handleChoose(idx)}
                  disabled={selectedIndex !== null}
                >
                  {choice}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 rounded-xl border border-zinc-700/60 bg-zinc-900/60 p-3 text-xs text-neutral-200">
          {selectedIndex === null ? (
            <p>選択肢を1つ選んでください。</p>
          ) : (
            <>
              <p className="mb-1 font-semibold">
                {selectedIndex === current.answerIndex
                  ? "正解です！"
                  : "不正解です。"}
              </p>
              <p className="whitespace-pre-wrap">{current.explanation}</p>
              <p className="mt-2 text-[11px] text-neutral-400">
                出典：{REFERENCE_TEXT}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-neutral-400">
            現在の正解数：{score} / {questions.length}
          </div>
          <button
            type="button"
            onClick={handleNext}
            disabled={selectedIndex === null || sending}
            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full border border-emerald-500/70 bg-emerald-600/20 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-60"
          >
            {isLast ? "今日の分を終了する" : "次の問題へ"}
          </button>
        </div>

        {errorMsg && (
          <p className="mt-2 text-xs text-amber-300">{errorMsg}</p>
        )}
      </section>
    </main>
  );
}

