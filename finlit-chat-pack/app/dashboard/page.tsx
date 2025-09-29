// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

type Insight = {
  month: string;
  income: number;
  expense: number;
  net: number;
  daily: { day: number; income: number; expense: number; net: number }[];
  byCategory: { id: number; name: string; total: number }[];
};

function ymNow(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset, 1);
  return d.toISOString().slice(0, 7);
}

export default function DashboardPage() {
  const [ym, setYm] = useState(ymNow(0));
  const [data, setData] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    fetch(`/api/insights/monthly?month=${ym}`)
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((j) => setData(j))
      .catch((e) => setErr(e?.error || "failed"))
      .finally(() => setLoading(false));
  }, [ym]);

  const daily = useMemo(() => data?.daily || [], [data]);
  const byCat = useMemo(() => data?.byCategory || [], [data]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ダッシュボード</h1>
        <div className="flex items-center gap-2">
          <select
            className="select"
            value={ym}
            onChange={(e) => setYm(e.target.value)}
          >
            <option value={ymNow(0)}>今月（{ymNow(0)}）</option>
            <option value={ymNow(-1)}>先月（{ymNow(-1)}）</option>
            {/* 任意指定 */}
          </select>
          <input
            className="input w-36"
            type="month"
            value={ym}
            onChange={(e) => setYm(e.target.value)}
          />
          <a
            className="btn"
            href={`/api/exports/csv?month=${ym}`}
            target="_blank"
          >
            CSV
          </a>
        </div>
      </div>

      {loading && <div className="card">読み込み中…</div>}
      {err && <div className="card text-red-400">エラー: {err}</div>}
      {!loading && !err && data && (
        <>
          {/* KPI */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="kpi">
              <div className="text-xs text-muted">今月の収入</div>
              <div className="text-2xl font-bold">
                {data.income.toLocaleString()}円
              </div>
            </div>
            <div className="kpi">
              <div className="text-xs text-muted">今月の支出</div>
              <div className="text-2xl font-bold">
                {data.expense.toLocaleString()}円
              </div>
            </div>
            <div className="kpi">
              <div className="text-xs text-muted">今月の差額</div>
              <div className="text-2xl font-bold">
                {(data.income - data.expense).toLocaleString()}円
              </div>
            </div>
          </div>

          {/* 日別推移 */}
          <div className="card">
            <div className="text-sm text-muted mb-2">日別収支推移</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="income" />
                  <Line type="monotone" dataKey="expense" />
                  <Line type="monotone" dataKey="net" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* カテゴリ別支出トップ */}
          <div className="card">
            <div className="text-sm text-muted mb-2">カテゴリ別支出トップ</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCat}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

