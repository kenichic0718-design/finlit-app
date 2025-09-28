// components/BudgetList.tsx
"use client";

import React from "react";

type Item = { category: string; budget: number; actual: number };
type Res = {
  ok: boolean;
  month: string;
  items: Item[];
  totals: { budget: number; actual: number; remaining: number };
};

function Progress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-2 rounded bg-zinc-800/60">
      <div className="h-2 rounded bg-zinc-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function BudgetList({ month }: { month: string }) {
  const [data, setData] = React.useState<Res | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/budgets?month=${encodeURIComponent(month)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (alive) {
        setData(json);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [month]);

  if (loading) return <div className="text-sm text-zinc-400">読み込み中…</div>;
  if (!data?.items?.length)
    return <div className="text-sm text-zinc-400">この月の予算はまだありません。</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="rounded border border-zinc-700/60 p-4">
          <div className="text-zinc-400">今月の予算合計</div>
          <div className="text-xl font-semibold">
            {data.totals.budget.toLocaleString()} 円
          </div>
        </div>
        <div className="rounded border border-zinc-700/60 p-4">
          <div className="text-zinc-400">今月の支出</div>
          <div className="text-xl font-semibold">
            {data.totals.actual.toLocaleString()} 円
          </div>
        </div>
        <div className="rounded border border-zinc-700/60 p-4">
          <div className="text-zinc-400">残り予算</div>
          <div className="text-xl font-semibold">
            {data.totals.remaining.toLocaleString()} 円
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {data.items.map((it, i) => {
          const progress = it.budget > 0 ? (it.actual / it.budget) * 100 : 0;
          return (
            <div key={i} className="p-3 rounded border border-zinc-700/50">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium">{it.category}</div>
                <div className="text-sm tabular-nums">
                  {it.actual.toLocaleString()} / {it.budget.toLocaleString()} 円
                </div>
              </div>
              <Progress value={progress} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

