'use client';

// app/learn/page.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Q = {
  id: number;
  topic: string;
  question: string;
  choices: string[];
  answer_index: number;
  rationale_correct: string;
  rationale_wrong: string;
};

const TOPIC_CANDIDATES = ["APR", "インフレ", "分散投資", "固定費", "複利"] as const;
const DAILY_GOAL = 5;

// localStorage keys（SSRとの不一致を避けるため、描画後に読む）
const LS_SOLVED_PREFIX = "finlit_solved_"; // 例: finlit_solved_2025-09-28
const LS_STREAK = "finlit_streak";
const LS_LAST_DAY = "finlit_last_ymd";

function todayKeyUTC() {
  // Hydration差を避けたければUTCで固定
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function LearnPage() {
  const [topics, setTopics] = useState<string[]>([]);
  const [onlyWrong, setOnlyWrong] = useState(false);

  const [q, setQ] = useState<Q | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [chosen, setChosen] = useState<number | null>(null);
  const [answering, setAnswering] = useState(false);

  // 進捗（Hydration対策：初回描画では出さず、useEffectでreadyにしてから出す）
  const [ready, setReady] = useState(false);
  const [solvedToday, setSolvedToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const todayKeyRef = useRef<string>("");

  // 同一セッション内の重複出題避け・ダブり加算防止
  const seenIds = useRef<Set<number>>(new Set());
  const answeredOnce = useRef<Set<number>>(new Set());

  // 初期化（progress読み込み）
  useEffect(() => {
    const ymd = todayKeyUTC();
    todayKeyRef.current = ymd;
    const saved = Number(localStorage.getItem(LS_SOLVED_PREFIX + ymd) || 0);
    const st = Number(localStorage.getItem(LS_STREAK) || 0);
    setSolvedToday(saved);
    setStreak(st);
    setReady(true);
  }, []);

  // 日付跨ぎ時のストリーク更新（初回呼び出し時）
  useEffect(() => {
    const ymd = todayKeyRef.current || todayKeyUTC();
    const lastYmd = localStorage.getItem(LS_LAST_DAY);
    if (lastYmd !== ymd) {
      // 連続日数の簡易計算（厳密な差は不要なら1日にする）
      const nextStreak =
        lastYmd && isNextDay(lastYmd, ymd) ? Number(localStorage.getItem(LS_STREAK) || 0) + 1 : 1;
      localStorage.setItem(LS_STREAK, String(nextStreak));
      localStorage.setItem(LS_LAST_DAY, ymd);
      setStreak(nextStreak);
      // solvedTodayは日替わりで0から
      localStorage.setItem(LS_SOLVED_PREFIX + ymd, "0");
      setSolvedToday(0);
    }
  }, []);

  // 出題
  const fetchNext = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setChosen(null);
    try {
      const params = new URLSearchParams();
      if (topics.length) params.set("topics", topics.join(","));
      if (onlyWrong) params.set("onlyWrong", "1");
      if (seenIds.current.size) params.set("exclude", Array.from(seenIds.current).join(","));

      const res = await fetch(`/api/learn/next?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Failed: ${res.status}`);
      }
      const data = await res.json();
      const row = (data?.item ?? data) as any;
      if (!row || !row.id) {
        setQ(null);
        setErr("出題できる問題がありません。条件を変えて再試行してください。");
        return;
      }

      const choices = Array.isArray(row.choices) ? row.choices : safeParseArray(row.choices);
      const nq: Q = {
        id: Number(row.id),
        topic: String(row.topic ?? ""),
        question: String(row.question ?? ""),
        choices: choices,
        answer_index: Number(row.answer_index ?? 0),
        rationale_correct: String(row.rationale_correct ?? ""),
        rationale_wrong: String(row.rationale_wrong ?? ""),
      };
      setQ(nq);
      seenIds.current.add(nq.id);
    } catch (e: any) {
      setErr(e?.message || "取得に失敗しました");
      setQ(null);
    } finally {
      setLoading(false);
    }
  }, [topics, onlyWrong]);

  useEffect(() => {
    // 条件が変わるたびにリセットして再取得
    seenIds.current.clear();
    fetchNext();
  }, [fetchNext]);

  // 回答
  const onChoose = async (idx: number) => {
    if (!q || chosen !== null) return;
    setChosen(idx);

    // サーバ保存（結果はUIに反映済みなので、失敗しても表示は維持）
    setAnswering(true);
    try {
      await fetch("/api/learn/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: q.id,
          chosen_index: idx,
          is_correct: idx === q.answer_index,
        }),
      }).catch(() => null);
    } finally {
      setAnswering(false);
    }

    // 進捗のクライアント更新（同一問は1回だけ加算）
    if (!answeredOnce.current.has(q.id)) {
      answeredOnce.current.add(q.id);
      const ymd = todayKeyRef.current || todayKeyUTC();
      const next = solvedToday + 1;
      setSolvedToday(next);
      localStorage.setItem(LS_SOLVED_PREFIX + ymd, String(next));
      localStorage.setItem(LS_LAST_DAY, ymd);
      if (!localStorage.getItem(LS_STREAK)) localStorage.setItem(LS_STREAK, String(streak || 1));
    }
  };

  const correctIndex = q?.answer_index ?? -1;
  const isCorrect = chosen != null && chosen === correctIndex;

  const toggleTopic = (t: string) =>
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const clearAll = () => {
    setTopics([]);
    setOnlyWrong(false);
    seenIds.current.clear();
    answeredOnce.current.clear();
    fetchNext();
  };

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">学ぶ</h1>
        <a href="/learn/stats" className="text-sm text-blue-300 hover:underline">
          成績を見る →
        </a>
      </div>

      {/* トピックフィルタ / オプション */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm opacity-80">トピック:</span>
        {TOPIC_CANDIDATES.map((t) => {
          const active = topics.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggleTopic(t)}
              className={[
                "px-3 py-1 rounded-lg text-sm border transition",
                active ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10",
              ].join(" ")}
            >
              {t}
            </button>
          );
        })}
        <button
          onClick={clearAll}
          className="ml-2 px-3 py-1 rounded-lg text-sm border border-white/10 bg-white/5"
        >
          クリア
        </button>

        <label className="ml-4 inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyWrong}
            onChange={(e) => {
              setOnlyWrong(e.target.checked);
              seenIds.current.clear();
              answeredOnce.current.clear();
            }}
          />
          <span>不正解だけ復習</span>
        </label>

        <div className="ml-auto text-sm opacity-80">
          今日の進捗:{" "}
          <span className="font-semibold">
            {ready ? solvedToday : "—"}/{DAILY_GOAL}
          </span>
          <span className="ml-2">| 連続</span>{" "}
          <span className="font-semibold">{ready ? streak : "—"}</span> 日
        </div>
      </div>

      {/* 本体 */}
      {loading && <p className="text-sm text-white/60">読み込み中…</p>}
      {err && !q && <p className="text-sm text-red-400">{err}</p>}
      {!loading && !q && !err && (
        <p className="text-sm text-white/60">出題できる問題がありません。</p>
      )}

      {q && (
        <section className="space-y-4">
          <div className="text-xs text-white/60">{q.topic}</div>
          <h2 className="text-lg font-semibold">{q.question}</h2>

          <div className="space-y-2">
            {q.choices.map((c, i) => {
              const base =
                "w-full rounded-lg border px-3 py-2 text-left transition disabled:cursor-not-allowed";
              const look =
                chosen === null
                  ? "border-white/15 hover:bg-white/5"
                  : i === correctIndex
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : i === chosen
                  ? "border-rose-400/40 bg-rose-500/10"
                  : "border-white/10 opacity-70";

              return (
                <button
                  key={i}
                  disabled={answering || chosen !== null}
                  onClick={() => onChoose(i)}
                  className={[base, look].join(" ")}
                >
                  {String.fromCharCode(65 + i)}. {c}
                </button>
              );
            })}
          </div>

          {/* 解説 */}
          {chosen !== null && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold">{isCorrect ? "正解！" : "不正解"}</div>
              <p className="mt-1 text-sm">
                {isCorrect ? q.rationale_correct : q.rationale_wrong}
              </p>

              <div className="mt-4 text-sm">
                <div className="font-semibold mb-1">今日の行動提案</div>
                {q.topic === "固定費" ? (
                  <p>
                    携帯/サブスク/保険の月額を1つ見直してみよう。下の「記録」で固定費カテゴリを確認。
                  </p>
                ) : (
                  <p>
                    「目標」で想定年率を1%上下にして、複利の差を体感してみよう。
                  </p>
                )}
              </div>

              <div className="mt-4">
                <button
                  onClick={fetchNext}
                  className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                >
                  次の問題へ →
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

/** utils */
function safeParseArray(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
  }
  return [];
}

function isNextDay(prevYmd: string, currYmd: string) {
  // prev + 1日 = curr をざっくり判定（UTC基準）
  const prev = new Date(prevYmd + "T00:00:00Z").getTime();
  const curr = new Date(currYmd + "T00:00:00Z").getTime();
  const diff = Math.round((curr - prev) / 86400000);
  return diff === 1;
}
