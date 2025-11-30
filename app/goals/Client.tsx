"use client";
// app/goals/page.tsx

import { useEffect, useMemo, useState } from "react";
import MonthPicker from "@/components/ui/MonthPicker";
import { Pill } from "@/components/ui/PillTabs";
import ProgressBar from "@/components/ui/ProgressBar";

type Kind = "expense" | "income";
type Log = { amount: number; kind: Kind; category_id: string };
type Budget = { id: string; kind: Kind; category_id: string; amount_int: number; name?: string };
type Category = { id: string; name: string; kind: Kind };

type Row = {
  category_id: string;
  name: string;
  budget: number; // expense: 予算, income: 目標
  used: number;   // expense: 使用, income: 実績
  pct: number;
};

export default function GoalsPage() {
  const [kind, setKind] = useState<Kind>("expense");
  const [ym, setYm] = useState<string>(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    setLoading(true);

    // マスタ：カテゴリ（名前付け）
    const catsRes = await fetch(`/api/categories?kind=${kind}`).then((r) => r.json());
    const cats: Category[] = Array.isArray(catsRes.data?.items) ? catsRes.data.items : [];
    const nameOf = (id: string) => cats.find((c) => c.id === id)?.name || "(該当なし)";

    // 予算/目標
    const bRes = await fetch(`/api/budgets?month=${ym}&kind=${kind}`).then((r) => r.json());
    const budgets: Budget[] = Array.isArray(bRes.data?.items) ? bRes.data.items : [];

    // 実績（支出 or 収入）
    const lRes = await fetch(`/api/logs?month=${ym}`).then((r) => r.json());
    const logs: Log[] = Array.isArray(lRes.data?.items) ? lRes.data.items : [];
    const usedByCat = new Map<string, number>();
    logs
      .filter((l) => l.kind === kind)
      .forEach((l) => usedByCat.set(l.category_id, (usedByCat.get(l.category_id) || 0) + (l.amount || 0)));

    // 統合（カテゴリ一覧に対し、予算(目標)と使用(実績)を突合）
    const allCatIds = new Set<string>([
      ...cats.map((c) => c.id),
      ...budgets.map((b) => b.category_id),
      ...Array.from(usedByCat.keys()),
    ]);

    const list: Row[] = Array.from(allCatIds).map((id) => {
      const b = budgets.find((x) => x.category_id === id)?.amount_int ?? 0;
      const u = usedByCat.get(id) ?? 0;
      const pct = b > 0 ? Math.min(100, Math.round((u / b) * 100)) : 0;
      return { category_id: id, name: nameOf(id), budget: b, used: u, pct };
    });

    // ソート：支出=進捗降順、収入=進捗降順（達成度が高い順に）
    list.sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name, "ja"));

    setRows(list);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [ym, kind]);

  const totalBudget = useMemo(() => rows.reduce((s, x) => s + x.budget, 0), [rows]);
  const totalUsed = useMemo(() => rows.reduce((s, x) => s + x.used, 0), [rows]);
  const totalPct = useMemo(() => {
    const base = totalBudget || 1;
    return Math.min(100, Math.round((totalUsed / base) * 100));
  }, [totalBudget, totalUsed]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">目標</h1>
        <div className="flex items-center gap-2">
          <MonthPicker ym={ym} setYm={setYm} />
          <div className="ml-2 flex gap-2">
            <Pill active={kind === "expense"} onClick={() => setKind("expense")}>
              支出
            </Pill>
            <Pill active={kind === "income"} onClick={() => setKind("income")}>
              収入
            </Pill>
          </div>
          <a
            href="/sim/goal"
            className="ml-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          >
            詳しく試算（/sim/goal）
          </a>
        </div>
      </div>

      {/* 月間サマリ */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">
            今月の{kind === "expense" ? "使用状況" : "達成状況"}
          </h2>
          <span className="text-xs text-zinc-400">
            {kind === "expense" ? "予算合計" : "目標合計"} {totalBudget.toLocaleString("ja-JP")}円 /{" "}
            {kind === "expense" ? "使用" : "実績"} {totalUsed.toLocaleString("ja-JP")}円
          </span>
        </div>
        <ProgressBar value={totalPct} />
        <div className="mt-1 text-right text-[11px] text-zinc-500">{totalPct}%</div>
      </div>

      {/* カテゴリ一覧 */}
      <div className="space-y-3">
        {loading && <p className="text-sm text-zinc-400">読み込み中…</p>}

        {!loading &&
          rows.map((r) => (
            <div
              key={r.category_id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="font-medium text-zinc-200">{r.name}</div>
                <div className="text-xs text-zinc-400">
                  {kind === "expense" ? "使用" : "実績"} {r.used.toLocaleString("ja-JP")}円 /{" "}
                  {kind === "expense" ? "予算" : "目標"} {r.budget.toLocaleString("ja-JP")}円
                </div>
              </div>
              <ProgressBar value={r.pct} />
              <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                <span>{r.pct}%</span>
                <a
                  href="/sim/goal"
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] hover:bg-zinc-800"
                >
                  詳しく試算（/sim/goal）
                </a>
              </div>
            </div>
          ))}
      </div>

      <p className="text-xs leading-6 text-zinc-500">
        ※ 「予算（支出）」「目標（収入）」は
        <a href="/budgets" className="underline decoration-zinc-600 hover:text-zinc-200">予算ページ</a>
        で設定できます。実績は
        <a href="/logs" className="underline decoration-zinc-600 hover:text-zinc-200">記録ページ</a>
        の入力が反映されます。
      </p>
    </div>
  );
}

