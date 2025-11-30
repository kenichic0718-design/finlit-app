// app/learn/stats/_PageClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TopicRow = {
  topic: string;       // 日本語ラベル（家計管理・サブスク など）
  correct: number;     // 正解数
  total: number;       // 解いた数
  sessions: number;    // 実施回数
  rate: number;        // 正答率 0〜1
};

type StatsOk = {
  ok: true;
  byTopic: TopicRow[];
};

type StatsError = {
  ok: false;
  error: string;
};

type StatsResp = StatsOk | StatsError;

const DAYS = 30;

export default function PageClient() {
  const [stats, setStats] = useState<StatsOk | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    void fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/learn/stats?days=${DAYS}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data: StatsResp = await res.json();
      if (!data.ok) {
        setStats(null);
        setErrorMsg((data as StatsError).error ?? "学習成績の取得に失敗しました。");
      } else {
        setStats(data);
      }
    } catch (e: any) {
      setStats(null);
      setErrorMsg(e?.message ?? "学習成績の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  const { totalSolved, totalCorrect, totalRate } = useMemo(() => {
    if (!stats) {
      return { totalSolved: 0, totalCorrect: 0, totalRate: 0 };
    }
    const solved = stats.byTopic.reduce((acc, t) => acc + (t.total ?? 0), 0);
    const correct = stats.byTopic.reduce((acc, t) => acc + (t.correct ?? 0), 0);
    const rate = solved > 0 ? Math.round((correct / solved) * 100) : 0;
    return { totalSolved: solved, totalCorrect: correct, totalRate: rate };
  }, [stats]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      {/* ヘッダー：学ぶに戻る ＋ ミニクイズへ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/learn"
            className="text-sm text-zinc-400 underline underline-offset-4 hover:text-zinc-100"
          >
            ← 学ぶに戻る
          </Link>
          <h1 className="text-2xl font-bold text-zinc-50">学習成績</h1>
        </div>
        <Link
          href="/learn/quiz"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-400/70 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20"
        >
          ミニクイズへ戻る
        </Link>
      </div>

      <p className="text-sm text-zinc-300">
        直近{DAYS}日分のミニクイズの結果を集計しています。
      </p>

      {errorMsg && (
        <div className="rounded-xl border border-rose-400/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
          学習成績の取得に失敗しました：{errorMsg}
        </div>
      )}

      {/* サマリーカード */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/70 px-4 py-3">
          <div className="text-xs text-zinc-400">直近{DAYS}日で解いた問題数</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-50">
            {totalSolved}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/70 px-4 py-3">
          <div className="text-xs text-zinc-400">直近{DAYS}日の正解数</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-50">
            {totalCorrect}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/70 px-4 py-3">
          <div className="text-xs text-zinc-400">直近{DAYS}日の正答率</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-50">
            {totalRate}%
          </div>
        </div>
      </section>

      {/* 更新ボタン */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void fetchStats()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-600 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "更新中…" : "今すぐ更新"}
        </button>
      </div>

      {/* トピック別正答率 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">トピック別正答率</h2>
        <p className="text-xs text-zinc-400">
          解いた回数・正答数・正答率をトピックごとに表示します。
        </p>

        <div className="overflow-x-auto rounded-2xl border border-zinc-700/70 bg-zinc-950/40">
          <table className="min-w-full text-left text-xs text-zinc-200">
            <thead>
              <tr className="border-b border-zinc-700/60 bg-zinc-900/60">
                <th className="px-4 py-2 font-semibold">トピック</th>
                <th className="px-4 py-2 font-semibold">解いた数</th>
                <th className="px-4 py-2 font-semibold">正答</th>
                <th className="px-4 py-2 font-semibold">正答率</th>
                <th className="px-4 py-2 font-semibold">指標</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.byTopic ?? []).map((row, idx) => {
                const solved = row.total ?? 0;
                const correct = row.correct ?? 0;
                const ratePct =
                  solved > 0 ? Math.round((correct / solved) * 100) : 0;

                return (
                  <tr
                    key={`${row.topic}-${idx}`}
                    className="border-t border-zinc-800/70"
                  >
                    <td className="px-4 py-2">{row.topic}</td>
                    <td className="px-4 py-2">{solved}</td>
                    <td className="px-4 py-2">{correct}</td>
                    <td className="px-4 py-2">{ratePct}%</td>
                    <td className="px-4 py-2">
                      <div className="h-1.5 w-32 rounded-full bg-zinc-800">
                        <div
                          className="h-1.5 rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(ratePct, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {(!stats || stats.byTopic.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-xs text-zinc-400"
                  >
                    まだミニクイズの履歴がありません。まずは
                    <Link
                      href="/learn/quiz"
                      className="text-emerald-300 underline underline-offset-4"
                    >
                      ミニクイズ
                    </Link>
                    から解いてみましょう。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

