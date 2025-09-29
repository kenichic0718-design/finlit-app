'use client';

// app/sim/dca-vs-lump/page.tsx
import { useMemo, useState } from "react";
import { simulateDcaVsLump } from "@/lib/finance";

export default function DcaVsLumpPage() {
  const [total, setTotal] = useState(300000);
  const [months, setMonths] = useState(24);
  const [apr, setApr] = useState(5);
  const [vol, setVol] = useState(20);
  const [paths, setPaths] = useState(200);

  const res = useMemo(()=>simulateDcaVsLump({ total, months, aprPct: apr, volPct: vol, paths }), [total, months, apr, vol, paths]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">DCA vs 一括</h1>
        <a href="/learn" className="text-sm underline opacity-80">関連クイズへ</a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <label className="flex flex-col gap-1"><span className="text-sm text-muted">投資総額（円）</span>
          <input type="number" className="input" value={total} onChange={(e)=>setTotal(Number(e.target.value||0))} min={1} /></label>
        <label className="flex flex-col gap-1"><span className="text-sm text-muted">期間（月）</span>
          <input type="number" className="input" value={months} onChange={(e)=>setMonths(Number(e.target.value||1))} min={1} /></label>
        <label className="flex flex-col gap-1"><span className="text-sm text-muted">想定年率（%）</span>
          <input type="number" step="0.1" className="input" value={apr} onChange={(e)=>setApr(Number(e.target.value||0))} min={0} /></label>
        <label className="flex flex-col gap-1"><span className="text-sm text-muted">年率ボラ（%）</span>
          <input type="number" step="1" className="input" value={vol} onChange={(e)=>setVol(Number(e.target.value||0))} min={0} /></label>
        <label className="flex flex-col gap-1"><span className="text-sm text-muted">試行回数</span>
          <input type="number" className="input" value={paths} onChange={(e)=>setPaths(Number(e.target.value||10))} min={10} /></label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="kpi"><div className="text-sm text-muted">DCAが勝つ確率</div><div className="text-2xl font-bold">{Math.round(res.winRate*100)}%</div></div>
        <div className="kpi"><div className="text-sm text-muted">DCA中央値</div><div className="text-xl font-semibold">{Math.round(res.dcaMedian).toLocaleString()}円</div></div>
        <div className="kpi"><div className="text-sm text-muted">一括中央値</div><div className="text-xl font-semibold">{Math.round(res.lumpMedian).toLocaleString()}円</div></div>
      </div>

      <p className="text-xs text-muted mt-3">※簡易GBM。リスクは“振れ幅”として把握するための教育用。</p>
    </main>
  );
}

