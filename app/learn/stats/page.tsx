'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// app/learn/stats/page.tsx

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TopicRow = { topic: string; solved: number; correct: number };
type StatsResp =
  | {
      ok: true;
      todaySolved: number;
      todayCorrect: number;
      byTopic: TopicRow[];
      // ここは今は未使用（折れ線グラフ差し替え予定）
      byDay?: { ymd: string; solved: number; correct: number }[];
    }
  | { ok: false; error: string };

const fmtPct = (num: number) =>
  Number.isFinite(num) ? `${Math.round(num)}%` : "0%";

export default function LearnStatsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<Extract<StatsResp, { ok: true }> | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/learn/stats?days=30", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as StatsResp;
      if (!res.ok || !("ok" in json) || !json.ok) {
        throw new Error((json as any)?.error || `Failed: ${res.status}`);
      }
      setData(json);
    } catch (e: any) {
      setErr(e?.message || "統計の取得に失敗しました");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const todayRate = useMemo(() => {
    if (!data) return 0;
    const { todaySolved, todayCorrect } = data;
    if (!todaySolved) return 0;
    return (todayCorrect / todaySolved) * 100;
  }, [data]);

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">学習成績</h1>
        <Link href="/learn" className="text-sm text-blue-300 hover:underline">
          ← 学ぶへ戻る
        </Link>
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={load}
          className="rounded border border-white/15 px-3 py-1 text-sm hover:bg-white/10 disabled:opacity-50"
          disabled={loading}
        >
          今すぐ更新
        </button>
      </div>

      {/* エラー */}
      {err && (
        <div className="rounded border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          エラー：{err}
        </div>
      )}

      {/* KPI */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="kpi">
          <div className="text-xs text-muted">今日 解いた数</div>
          <div className="mt-1 text-3xl font-bold">
            {loading ? "…" : data?.todaySolved ?? 0}
          </div>
        </div>
        <div className="kpi">
          <div className="text-xs text-muted">今日 正答</div>
          <div className="mt-1 text-3xl font-bold">
            {loading ? "…" : data?.todayCorrect ?? 0}
          </div>
        </div>
        <div className="kpi">
          <div className="text-xs text-muted">今日 正答率</div>
          <div className="mt-1 text-3xl font-bold">
            {loading
              ? "…"
              : fmtPct(
                  data && data.todaySolved
                    ? (data.todayCorrect / data.todaySolved) * 100
                    : 0
                )}
          </div>
        </div>
      </section>

      {/* 30日集計（グラフ置き場） */}
      <section className="card">
        <div className="text-sm font-medium">直近30日の学習回数と正答</div>
        <div className="mt-2 text-xs text-muted">(グラフは後で差し替え)</div>

        {/* 空表示のときに高さ0にならないよう軽いプレースホルダ */}
        <div className="mt-4 h-28 rounded bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-xs text-muted">
          プレースホルダ
        </div>

        <div className="mt-2 text-[11px] text-muted">下層=正答、上層=解いた数</div>
      </section>

      {/* トピック別 正答率 */}
      <section className="card">
        <div className="text-sm font-medium mb-3">トピック別 正答率</div>

        {!loading && (!data?.byTopic || data.byTopic.length === 0) && (
          <div className="text-sm text-muted">データがありません</div>
        )}

        {loading && <div className="text-sm text-muted">読み込み中…</div>}

        {!!data?.byTopic?.length && (
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="py-2 pr-2">トピック</th>
                <th className="py-2 pr-2 w-20">解いた数</th>
                <th className="py-2 pr-2 w-16">正答</th>
                <th className="py-2 pr-2 w-16">正答率</th>
                <th className="py-2">指標</th>
              </tr>
            </thead>
            <tbody>
              {data.byTopic.map((r) => {
                const rate =
                  r.solved > 0 ? Math.round((r.correct / r.solved) * 100) : 0;
                return (
                  <tr key={r.topic} className="border-t border-line">
                    <td className="py-2 pr-2">{r.topic}</td>
                    <td className="py-2 pr-2">{r.solved}</td>
                    <td className="py-2 pr-2">{r.correct}</td>
                    <td className="py-2 pr-2">{fmtPct(rate)}</td>
                    <td className="py-2">
                      <div className="h-2 w-full rounded bg-white/5 ring-1 ring-white/10">
                        <div
                          className="h-2 rounded bg-brand"
                          style={{ width: `${Math.min(100, rate)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
