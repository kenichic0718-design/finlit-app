// app/sim/dca-vs-lump/_PageClient.tsx
'use client';

import { useMemo, useState } from "react";

// このページ専用のシミュレーション関数（lib/finance への依存を切る）
type SimParams = {
  total: number;
  months: number;
  aprPct: number;
  volPct: number;
  paths: number;
};

type SimResult = {
  winRate: number;
  dcaMedian: number;
  lumpMedian: number;
};

// 標準正規乱数（Box-Muller）
function normalRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  if (arr.length % 2 === 0) {
    return (arr[mid - 1] + arr[mid]) / 2;
  }
  return arr[mid];
}

// DCA vs 一括の簡易GBMシミュレーション
function simulateDcaVsLump({
  total,
  months,
  aprPct,
  volPct,
  paths,
}: SimParams): SimResult {
  const nMonths = Math.max(1, Math.round(months));
  const trials = Math.max(10, Math.round(paths));
  const investPerMonth = total / nMonths;

  const muYear = aprPct / 100;
  const sigmaYear = Math.max(0, volPct / 100);
  const muMonth = muYear / 12;
  const sigmaMonth = sigmaYear / Math.sqrt(12);

  const dcaValues: number[] = [];
  const lumpValues: number[] = [];
  let dcaWins = 0;

  for (let t = 0; t < trials; t++) {
    let price = 1;
    const prices: number[] = [price];

    // 価格パス生成
    for (let m = 0; m < nMonths; m++) {
      const z = normalRandom();
      const growth = Math.exp((muMonth - 0.5 * sigmaMonth * sigmaMonth) + sigmaMonth * z);
      price *= growth;
      prices.push(price);
    }

    const finalPrice = prices[prices.length - 1];

    // 一括：最初に全額
    const lumpShares = total / prices[0];
    const lumpVal = lumpShares * finalPrice;

    // DCA：毎月均等に購入
    let dcaShares = 0;
    for (let m = 0; m < nMonths; m++) {
      const buyPrice = prices[m]; // 各月の始めに買うイメージ
      dcaShares += investPerMonth / buyPrice;
    }
    const dcaVal = dcaShares * finalPrice;

    dcaValues.push(dcaVal);
    lumpValues.push(lumpVal);
    if (dcaVal >= lumpVal) dcaWins++;
  }

  const winRate = dcaWins / trials;
  const dcaMedian = median(dcaValues);
  const lumpMedian = median(lumpValues);

  return { winRate, dcaMedian, lumpMedian };
}

export default function DcaVsLumpPage() {
  const [total, setTotal] = useState(300000);
  const [months, setMonths] = useState(24);
  const [apr, setApr] = useState(5);
  const [vol, setVol] = useState(20);
  const [paths, setPaths] = useState(200);

  const res = useMemo(
    () =>
      simulateDcaVsLump({
        total,
        months,
        aprPct: apr,
        volPct: vol,
        paths,
      }),
    [total, months, apr, vol, paths]
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">DCA vs 一括</h1>
        <a href="/learn" className="text-sm underline opacity-80">
          関連クイズへ
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">投資総額（円）</span>
          <input
            type="number"
            className="input"
            value={total}
            onChange={(e) => setTotal(Number(e.target.value || 0))}
            min={1}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">期間（月）</span>
          <input
            type="number"
            className="input"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value || 1))}
            min={1}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">想定年率（%）</span>
          <input
            type="number"
            step="0.1"
            className="input"
            value={apr}
            onChange={(e) => setApr(Number(e.target.value || 0))}
            min={0}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">年率ボラ（%）</span>
          <input
            type="number"
            step="1"
            className="input"
            value={vol}
            onChange={(e) => setVol(Number(e.target.value || 0))}
            min={0}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">試行回数</span>
          <input
            type="number"
            className="input"
            value={paths}
            onChange={(e) => setPaths(Number(e.target.value || 10))}
            min={10}
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="kpi">
          <div className="text-sm text-muted">DCAが勝つ確率</div>
          <div className="text-2xl font-bold">
            {Math.round(res.winRate * 100)}%
          </div>
        </div>
        <div className="kpi">
          <div className="text-sm text-muted">DCA中央値</div>
          <div className="text-xl font-semibold">
            {Math.round(res.dcaMedian).toLocaleString()}円
          </div>
        </div>
        <div className="kpi">
          <div className="text-sm text-muted">一括中央値</div>
          <div className="text-xl font-semibold">
            {Math.round(res.lumpMedian).toLocaleString()}円
          </div>
        </div>
      </div>

      <p className="text-xs text-muted mt-3">
        ※簡易GBM。リスクは“振れ幅”として把握するための教育用。
      </p>
    </main>
  );
}
