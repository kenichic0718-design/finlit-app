"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getCurrentProfileId } from "../_utils/getCurrentProfileId";
import { fetchBudgetVsActual, summarize, type BudgetActualRow } from "../_utils/budgetActual";

function toYYYYMM(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

export default function DashboardPage() {
  const [profileId, setProfileId] = useState<string>("");
  const [yyyymm, setYYYYMM] = useState<string>(() => toYYYYMM(new Date()));
  const [rows, setRows] = useState<BudgetActualRow[]>([]);
  const summary = useMemo(() => summarize(rows), [rows]);

  useEffect(() => {
    (async () => {
      const pid = await getCurrentProfileId();
      setProfileId(pid);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!profileId) return;
      const data = await fetchBudgetVsActual(yyyymm, profileId);
      setRows(data);
    })();
  }, [profileId, yyyymm]);

  const ymDisp = `${yyyymm.slice(0,4)}年${yyyymm.slice(4,6)}月`;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">月を選択:</span>
        <input
          type="month"
          value={`${yyyymm.slice(0,4)}-${yyyymm.slice(4,6)}`}
          onChange={(e) => setYYYYMM(e.target.value.replace("-", ""))}
          className="bg-transparent border rounded px-3 py-2"
        />
        <span className="text-sm text-muted-foreground">{ymDisp}</span>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded p-4">
          <div className="text-xs text-muted-foreground">当月予算合計</div>
          <div className="text-xl font-semibold">{summary.budget.toLocaleString()} 円</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-xs text-muted-foreground">当月支出合計</div>
          <div className="text-xl font-semibold">{summary.spent.toLocaleString()} 円</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-xs text-muted-foreground">当月収入合計</div>
          <div className="text-xl font-semibold">{summary.income.toLocaleString()} 円</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-xs text-muted-foreground">進捗（支出/予算）</div>
          <div className="text-xl font-semibold">{summary.progress}%</div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">カテゴリ別 予算 vs 実績（支出）</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">カテゴリ</th>
                <th className="text-right py-2 pr-4">予算</th>
                <th className="text-right py-2 pr-4">実績(支出)</th>
                <th className="text-right py-2 pr-4">収入</th>
                <th className="text-right py-2">差額(予算-支出)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const diff = (r.budget ?? 0) - (r.actual ?? 0);
                return (
                  <tr key={r.category} className="border-b">
                    <td className="py-2 pr-4">{r.category}</td>
                    <td className="py-2 pr-4 text-right">{(r.budget ?? 0).toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right">{(r.actual ?? 0).toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right">{(r.income ?? 0).toLocaleString()}</td>
                    <td className="py-2 text-right">{diff.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

