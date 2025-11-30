// app/dashboard/Client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchJson,
  normalizeLogs,
  normalizeBudgets,
  sumByKind,
  yen,
  ymOf,
  LogItem,
  BudgetItem,
} from "@/lib/finance";

export default function DashboardPage() {
  const [ym, setYm] = useState<string>(new Date().toISOString().slice(0, 7));
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [buds, setBuds] = useState<BudgetItem[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rawL, rawB] = await Promise.all([
          fetchJson(`/api/logs?ym=${ym}`),
          fetchJson(`/api/budgets?ym=${ym}`),
        ]);
        if (!active) return;

        // occurred_at を使う
        setLogs(
          normalizeLogs(rawL).filter((x) => ymOf(x.occurred_at) === ym)
        );
        setBuds(normalizeBudgets(rawB).filter((x) => x.month === ym));
      } catch (e) {
        console.error(e);
        if (!active) {
          /* noop */
        }
        setLogs([]);
        setBuds([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [ym]);

  const usedExp = useMemo(() => sumByKind(logs, "expense"), [logs]);
  const usedInc = useMemo(() => sumByKind(logs, "income"), [logs]);
  const budExp = useMemo(() => sumByKind(buds, "expense"), [buds]);
  const budInc = useMemo(() => sumByKind(buds, "income"), [buds]);

  const pctExp =
    budExp === 0 ? 0 : Math.min(100, Math.round((usedExp / budExp) * 100));
  const pctInc =
    budInc === 0 ? 0 : Math.min(100, Math.round((usedInc / budInc) * 100));

  return (
    <main className="mx-auto max-w-5xl px-6 py-6 text-slate-100">
      <header className="mb-6 flex items-center gap-4">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <input
          type="month"
          className="rounded bg-slate-700 px-3 py-2"
          value={ym}
          onChange={(e) => setYm(e.target.value)}
        />
      </header>

      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-700 p-4">
          <div className="mb-2 text-sm text-slate-400">支出（当月）</div>
          <div className="mb-2">
            予算：{yen(budExp)}円 / 使用：{yen(usedExp)}円
          </div>
          <div className="h-2 rounded bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${pctExp}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 p-4">
          <div className="mb-2 text-sm text-slate-400">収入（当月）</div>
          <div className="mb-2">
            目標：{yen(budInc)}円 / 実績：{yen(usedInc)}円
          </div>
          <div className="h-2 rounded bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-sky-500"
              style={{ width: `${pctInc}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-slate-500">
          ※ API の新旧混在に対応するため、フロント側で正規化して集計しています。
        </p>
      </section>
    </main>
  );
}
