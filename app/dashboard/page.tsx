'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


'\''use client'\'';



// app/dashboard/page.tsx

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type DailyRow = { day: number; income: number; expense: number; net: number };
type CatRow = { name: string; total: number };
type InsightRes = {
  ok: boolean;
  guest?: boolean;
  month: string;
  income: number;
  expense: number;
  net: number;
  daily: DailyRow[];
  byCategory: CatRow[];
  budget_total: number;
  budget_remaining: number;
  error?: string;
};

function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function fmtYen(n: number) {
  return `${Number(n || 0).toLocaleString()} 円`;
}
function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export default function DashboardPage() {
  const [month, setMonth] = React.useState(thisMonth());
  const [data, setData] = React.useState<InsightRes | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);
        const res = await fetch(`/api/insights/monthly?month=${encodeURIComponent(month)}`, {
          cache: "no-store",
        });
        const json: InsightRes = await res.json();
        if (!alive) return;
        if (!json.ok) setErrMsg(json.error || "データ取得に失敗しました。");
        setData(json);
      } catch (e: any) {
        if (!alive) return;
        setErrMsg(e?.message ?? "予期せぬエラーが発生しました。");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [month]);

  const usagePct = React.useMemo(() => {
    if (!data) return 0;
    const used = Math.max(0, (data.budget_total || 0) - (data.budget_remaining || 0));
    if (!data.budget_total) return 0;
    return Math.min(100, Math.round((used / data.budget_total) * 100));
  }, [data]);

  const dailyForChart = React.useMemo(() => {
    if (!data?.daily?.length) return [];
    // recharts 用に day を "1","2",.. の文字列に
    return data.daily.map((d) => ({
      day: `${d.day}`,
      income: d.income,
      expense: d.expense,
      net: d.net,
    }));
  }, [data]);

  const cats = data?.byCategory ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">ダッシュボード</h1>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700"
          />
          <a
            href={`/api/exports/csv?month=${encodeURIComponent(month)}`}
            className="px-3 py-1 rounded border border-zinc-700 hover:bg-zinc-800 transition"
          >
            CSV をダウンロード
          </a>
        </div>
      </div>

      {errMsg && (
        <div className="rounded border border-red-700/60 bg-red-950/30 p-3 text-sm">
          {errMsg}
        </div>
      )}

      {data?.guest && (
        <div className="rounded border border-yellow-700/60 bg-yellow-950/30 p-3 text-sm">
          個別の集計を表示するにはサインインしてください。
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPI
          title="今月の収入"
          value={loading ? null : fmtYen(data?.income ?? 0)}
          subtitle={month}
        />
        <KPI
          title="今月の支出"
          value={loading ? null : fmtYen(data?.expense ?? 0)}
          subtitle={month}
        />
        <KPI
          title="差引（純額）"
          value={loading ? null : fmtYen((data?.net ?? 0))}
          subtitle={data && (data.net ?? 0) >= 0 ? "黒字" : "赤字"}
          valueClass={data && (data.net ?? 0) < 0 ? "text-red-400" : ""}
        />
        <KPI
          title="月次予算合計"
          value={loading ? null : fmtYen(data?.budget_total ?? 0)}
          subtitle="budgets 合計"
        />
        <KPI
          title="残り予算"
          value={loading ? null : fmtYen(data?.budget_remaining ?? 0)}
          subtitle={`${usagePct}% 消化`}
        />
      </div>

      {/* グラフ群 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 日別推移（収入/支出） */}
        <div className="rounded border border-zinc-700/60 p-4 col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">日別の収支推移</h2>
            <span className="text-xs text-zinc-400">月={month}</span>
          </div>
          <div className="h-64">
            {loading ? (
              <Skeleton />
            ) : dailyForChart.length === 0 ? (
              <div className="h-full grid place-items-center text-zinc-400 text-sm">
                今月のデータがありません。
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyForChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopOpacity={0.4} />
                      <stop offset="95%" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopOpacity={0.4} />
                      <stop offset="95%" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(v: any) => fmtYen(Number(v))} />
                  <Legend />
                  <Area type="monotone" dataKey="income" name="収入" fillOpacity={1} fill="url(#gIncome)" />
                  <Area type="monotone" dataKey="expense" name="支出" fillOpacity={1} fill="url(#gExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 上位支出カテゴリ */}
        <div className="rounded border border-zinc-700/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">上位支出カテゴリ</h2>
            <a
              href="/budgets"
              className="text-xs text-zinc-400 hover:text-zinc-200 underline-offset-2 hover:underline"
            >
              予算を編集
            </a>
          </div>
          <div className="h-64">
            {loading ? (
              <Skeleton />
            ) : cats.length === 0 ? (
              <div className="h-full grid place-items-center text-zinc-400 text-sm">
                支出カテゴリのデータがありません。
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cats.map((c) => ({ name: c.name, total: c.total }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v: any) => fmtYen(Number(v))} />
                  <Bar dataKey="total" name="支出合計" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 予算消化バー（全体） */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-zinc-400">予算消化</span>
              <span className="tabular-nums text-zinc-300">{usagePct}%</span>
            </div>
            <div className="w-full h-2 rounded bg-zinc-800/60">
              <div
                className={cn("h-2 rounded", usagePct > 100 ? "bg-red-500" : "bg-zinc-500")}
                style={{ width: `${Math.min(100, usagePct)}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-zinc-400">
              合計 {fmtYen(data?.budget_total ?? 0)} / 残り {fmtYen(data?.budget_remaining ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* 行動導線 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a
          href="/log"
          className="rounded border border-zinc-700/60 p-4 hover:bg-zinc-900 transition"
        >
          <div className="font-medium">記録する</div>
          <div className="text-sm text-zinc-400">今日の収支を追加しよう</div>
        </a>
        <a
          href="/budgets"
          className="rounded border border-zinc-700/60 p-4 hover:bg-zinc-900 transition"
        >
          <div className="font-medium">予算を見直す</div>
          <div className="text-sm text-zinc-400">カテゴリ別の上限を設定/更新</div>
        </a>
        <a
          href="/learn"
          className="rounded border border-zinc-700/60 p-4 hover:bg-zinc-900 transition"
        >
          <div className="font-medium">学ぶ</div>
          <div className="text-sm text-zinc-400">家計改善の基礎をクイズで復習</div>
        </a>
      </div>
    </div>
  );
}

function KPI(props: {
  title: string;
  value: string | null;
  subtitle?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded border border-zinc-700/60 p-4">
      <div className="text-sm text-zinc-400">{props.title}</div>
      <div className={cn("text-2xl font-semibold mt-1 tabular-nums", props.valueClass)}>
        {props.value ?? <span className="inline-block w-24 h-5 bg-zinc-800/60 rounded" />}
      </div>
      {props.subtitle && (
        <div className="text-xs text-zinc-500 mt-1">{props.subtitle}</div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="w-full h-full animate-pulse bg-zinc-900/40 rounded" />
  );
}

