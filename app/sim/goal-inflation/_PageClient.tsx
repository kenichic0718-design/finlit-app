'use client';

// app/sim/goal-inflation/page.tsx
import { useMemo, useState } from "react";
import { pmtForTarget, realRate, seriesFromMonthly, toRealPurchasingPower } from "@/lib/finance";
import GoalInflationChart from "@/components/GoalInflationChart";

export default function GoalInflationPage() {
  const [target, setTarget] = useState(300_000);
  const [months, setMonths] = useState(24);
  const [apr, setApr] = useState(3);        // 名目APR(%)
  const [infl, setInfl] = useState(2);      // インフレ率(%)
  const [initial, setInitial] = useState(0);

  const monthly = useMemo(() => pmtForTarget({ target, months, aprPct: apr, initial }), [target, months, apr, initial]);
  const realAprPct = useMemo(() => realRate(apr, infl) * 100, [apr, infl]);

  const { data } = useMemo(() => {
    const nominalRows = seriesFromMonthly({ monthly, months, aprPct: apr, initial });
    const toReal = toRealPurchasingPower({ nominal: 1, inflationPct: infl });
    const rows = nominalRows.map(r => ({
      m: r.m,
      nominal: r.balance,
      real: r.balance * toReal(r.m), // 名目→実質換算
    }));
    return { data: rows };
  }, [monthly, months, apr, initial, infl]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">インフレ対応ゴール</h1>
        <a href="/learn" className="text-sm underline opacity-80">関連クイズへ</a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">目標金額（円）</span>
          <input type="number" className="input" value={target} onChange={(e)=>setTarget(Number(e.target.value||0))} min={1} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">期間（月）</span>
          <input type="number" className="input" value={months} onChange={(e)=>setMonths(Number(e.target.value||1))} min={1} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">名目年率（%）</span>
          <input type="number" step="0.1" className="input" value={apr} onChange={(e)=>setApr(Number(e.target.value||0))} min={0}/>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">インフレ率（%）</span>
          <input type="number" step="0.1" className="input" value={infl} onChange={(e)=>setInfl(Number(e.target.value||0))} min={0}/>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">初期元本（任意）</span>
          <input type="number" className="input" value={initial} onChange={(e)=>setInitial(Number(e.target.value||0))} min={0}/>
        </label>
        <div className="flex items-end">
          <p className="text-sm">
            必要な毎月の積立目安： <span className="font-bold text-blue-300">{monthly.toLocaleString()}円</span><br/>
            実質年率：約{realAprPct.toFixed(2)}%
          </p>
        </div>
      </div>

      <GoalInflationChart data={data} target={target} />

      <p className="mt-2 text-xs text-muted">※毎月積立→その後に利息。実質はインフレで購買力換算。</p>
    </main>
  );
}

