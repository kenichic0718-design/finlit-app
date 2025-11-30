"use client";

import { useEffect, useMemo, useState } from "react";
import { MoneyInput } from "@/components/MoneyInput";
import { yen } from "@/lib/format";

type Prefill = { month?: string; target?: number; months?: number; rate?: number };

export default function GoalSimClient({ searchParams }: { searchParams?: { prefill?: string } }) {
  const prefill: Prefill | null = useMemo(() => {
    try { return searchParams?.prefill ? JSON.parse(decodeURIComponent(searchParams.prefill)) : null; }
    catch { return null; }
  }, [searchParams?.prefill]);

  const [target, setTarget] = useState<number>(prefill?.target ?? 300000);
  const [months, setMonths] = useState<number>(prefill?.months ?? 12);
  const [ratePercent, setRatePercent] = useState<number>(prefill?.rate ?? 0); // 年利（%）
  const [startYm, setStartYm] = useState<string>(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  });

  useEffect(() => {
    if (prefill?.month) setStartYm(prefill.month);
  }, [prefill?.month]);

  // 月利
  const r = useMemo(() => ratePercent / 100 / 12, [ratePercent]);

  // 毎月の積立額（将来価値の逆算）
  // FV = A * [((1+r)^n - 1) / r]  →  A = FV * r / ((1+r)^n - 1)
  const monthly = useMemo(() => {
    if (months <= 0) return 0;
    if (r === 0) return Math.ceil(target / months);
    const a = target * r / (Math.pow(1 + r, months) - 1);
    return Math.ceil(a);
  }, [target, months, r]);

  const total = useMemo(() => monthly * months, [monthly, months]);
  const interestGain = useMemo(() => Math.max(0, target - total), [target, total]);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">目標額シミュレーター</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1">
          <span className="text-sm text-gray-500">開始月</span>
          <input
            type="month"
            className="border rounded px-3 py-2 w-full"
            value={startYm}
            onChange={(e) => setStartYm(e.target.value)}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-500">目標額</span>
          <MoneyInput value={target} onChange={setTarget} className="w-full" />
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-500">期間（月）</span>
          <input
            type="number"
            min={1}
            className="border rounded px-3 py-2 w-full"
            value={months}
            onChange={(e) => setMonths(Math.max(1, Number(e.target.value || 0)))}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-500">年利（%）</span>
          <input
            type="number"
            step="0.01"
            min={0}
            className="border rounded px-3 py-2 w-full"
            value={ratePercent}
            onChange={(e) => setRatePercent(Math.max(0, Number(e.target.value || 0)))}
          />
        </label>
      </div>

      <div className="p-4 rounded-lg border bg-white">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">毎月の積立額</span>
          <strong className="text-xl">{yen(monthly)}</strong>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-600">積立総額</span>
          <strong>{yen(total)}</strong>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-600">運用益（概算）</span>
          <strong>{yen(interestGain)}</strong>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        ※ 将来価値の近似計算です。実際の利回り・積立結果は市場状況により変動します。
      </p>
    </div>
  );
}

