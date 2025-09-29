'use client';

// app/goal/page.tsx

import { useMemo, useState } from 'react';
import GoalChart from '@/components/GoalChart';

/** 毎月一定積立で目標金額を達成するための初期毎月額（APR考慮） */
function requiredMonthly(target: number, months: number, apr: number) {
  const r = apr / 100 / 12;
  if (!isFinite(r) || r === 0) return Math.ceil(target / months);
  const a = (target * r) / (Math.pow(1 + r, months) - 1);
  return Math.ceil(a);
}

export default function GoalPage() {
  const [target, setTarget] = useState<number>(300_000);
  const [months, setMonths] = useState<number>(24);
  const [apr, setApr] = useState<number>(3);

  // 追加: インフレ率・段階的増額（ステップアップ）
  const [inflation, setInflation] = useState<number>(2);   // 年率 %
  const [stepUpPct, setStepUpPct] = useState<number>(3);   // 増額率（毎ステップで%）
  const [stepUpEvery, setStepUpEvery] = useState<number>(6); // 何ヶ月ごとに増額

  // 基準の「必要毎月額」（ステップアップ前提ではない）
  const monthly = useMemo(
    () => requiredMonthly(target, months, apr),
    [target, months, apr]
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-white">
      <h1 className="text-2xl font-bold mb-6">目標</h1>

      {/* 入力フォーム */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-white/70">目標金額(円)</span>
          <input
            aria-label="目標金額"
            type="number"
            inputMode="numeric"
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 ring-blue-400"
            value={target}
            onChange={(e) => setTarget(Math.max(0, Number(e.target.value || 0)))}
            min={0}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-white/70">期間(月)</span>
          <input
            aria-label="期間(月)"
            type="number"
            inputMode="numeric"
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 ring-blue-400"
            value={months}
            onChange={(e) => setMonths(Math.max(1, Number(e.target.value || 1)))}
            min={1}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-white/70">想定年率(%)</span>
          <input
            aria-label="想定年率(%)"
            type="number"
            inputMode="decimal"
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 ring-blue-400"
            value={apr}
            onChange={(e) => setApr(Math.max(0, Number(e.target.value || 0)))}
            min={0}
            step={0.1}
          />
        </label>

        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-white/70">インフレ率(年率, %)</span>
            <input
              aria-label="インフレ率"
              type="number"
              inputMode="decimal"
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 ring-blue-400"
              value={inflation}
              onChange={(e) => setInflation(Math.max(0, Number(e.target.value || 0)))}
              min={0}
              step={0.1}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-white/70">増額率（ステップ毎, %）</span>
            <input
              aria-label="増額率"
              type="number"
              inputMode="decimal"
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 ring-blue-400"
              value={stepUpPct}
              onChange={(e) => setStepUpPct(Math.max(0, Number(e.target.value || 0)))}
              min={0}
              step={0.1}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-white/70">増額間隔（月）</span>
            <input
              aria-label="増額間隔"
              type="number"
              inputMode="numeric"
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 ring-blue-400"
              value={stepUpEvery}
              onChange={(e) => setStepUpEvery(Math.max(1, Number(e.target.value || 1)))}
              min={1}
            />
          </label>
        </div>
      </div>

      {/* 毎月の基準額表示 */}
      <div className="mb-4 text-sm md:text-base">
        基準の毎月積立目安（一定額の場合）：{" "}
        <span className="font-bold text-blue-300">{monthly.toLocaleString()}円</span>
      </div>

      <GoalChart
        months={months}
        aprBase={apr}
        targetAmount={target}
        baseMonthly={monthly}
        inflationAnnualPct={inflation}
        stepUpEveryMonths={stepUpEvery}
        stepUpPct={stepUpPct}
      />

      <p className="mt-3 text-xs text-white/60">
        ※補足：グラフは「基準の毎月額」を起点に、指定間隔ごとに
        <strong>段階的に増額</strong>したケースも描画。
        実質価値（インフレ考慮）も併記します。必要ならCSVで明細をダウンロードできます。
      </p>
    </main>
  );
}
