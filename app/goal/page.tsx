'use client';

import { useMemo, useState } from 'react';
import GoalChart from '@/components/GoalChart';

export default function GoalPage() {
  const [target, setTarget] = useState<number>(300000);
  const [months, setMonths] = useState<number>(24);
  const [apr, setApr] = useState<number>(3);

  // 必要毎月額（ベースAPRで算出）
  const monthly = useMemo(() => {
    const r = apr / 100 / 12;
    if (r === 0) return Math.ceil(target / months);
    const a = (target * r) / (Math.pow(1 + r, months) - 1);
    return Math.ceil(a);
  }, [target, months, apr]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 text-white">
      <h1 className="text-2xl font-bold mb-6">目標</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-white/70">目標金額(円)</span>
          <input
            aria-label="目標金額"
            type="number"
            inputMode="numeric"
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 ring-blue-400"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value || 0))}
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
            onChange={(e) => setMonths(Number(e.target.value || 0))}
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
            onChange={(e) => setApr(Number(e.target.value || 0))}
            min={0}
            step={0.1}
          />
        </label>

        <div className="flex items-end">
          <p className="text-sm md:text-base">
            必要な毎月の積立目安：{" "}
            <span className="font-bold text-blue-300">{monthly.toLocaleString()}円</span>
          </p>
        </div>
      </div>

      <GoalChart months={months} aprBase={apr} targetAmount={target} />

      <p className="mt-3 text-xs text-white/60">
        ※補足：毎月積立後に利息が乗る前提。APRを1%上げた場合の差も比較表示します。
      </p>
    </main>
  );
}

