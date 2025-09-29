// components/GoalChart.tsx
'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

type Props = {
  months: number;
  aprBase: number;            // 年率 %
  targetAmount: number;
  baseMonthly: number;        // ページ側で計算した一定額プランの毎月額
  inflationAnnualPct: number; // 年率 %
  stepUpEveryMonths: number;  // 何ヶ月ごとに増額
  stepUpPct: number;          // 増額率（%）
};

type Row = {
  m: number;                   // 1..N
  nominal_flat: number;        // 毎月一定プランの残高（名目）
  nominal_step: number;        // 段階的増額プランの残高（名目）
  real_flat: number;           // インフレ控除後の実質残高（一定）
  real_step: number;           // インフレ控除後の実質残高（段階）
  pay_flat: number;            // その月に積み立てる金額（一定）
  pay_step: number;            // その月に積み立てる金額（段階）
};

export default function GoalChart(props: Props) {
  const {
    months, aprBase, targetAmount, baseMonthly, inflationAnnualPct,
    stepUpEveryMonths, stepUpPct,
  } = props;

  const data: Row[] = useMemo(() => {
    const r = aprBase / 100 / 12;               // 月利
    const infl = inflationAnnualPct / 100 / 12; // 月次インフレ
    const rows: Row[] = [];

    let balFlat = 0;
    let balStep = 0;
    let stepMonthly = baseMonthly;

    for (let m = 1; m <= months; m++) {
      // 毎月の積立
      balFlat = balFlat * (1 + r) + baseMonthly;
      balStep = balStep * (1 + r) + stepMonthly;

      // 実質（購買力）= 名目 / (1+infl)^m
      const deflator = Math.pow(1 + infl, m);
      const realFlat = balFlat / (deflator || 1);
      const realStep = balStep / (deflator || 1);

      rows.push({
        m,
        nominal_flat: Math.round(balFlat),
        nominal_step: Math.round(balStep),
        real_flat: Math.round(realFlat),
        real_step: Math.round(realStep),
        pay_flat: baseMonthly,
        pay_step: Math.round(stepMonthly),
      });

      // ステップアップ（次月の積立額に適用）
      if (stepUpEveryMonths > 0 && m % stepUpEveryMonths === 0) {
        stepMonthly = stepMonthly * (1 + stepUpPct / 100);
      }
    }
    return rows;
  }, [months, aprBase, baseMonthly, inflationAnnualPct, stepUpEveryMonths, stepUpPct]);

  // 合計積立額などを右上に表示する用の集計
  const totals = useMemo(() => {
    const sum = (k: keyof Row) => data.reduce((s, r) => s + (Number(r[k]) || 0), 0);
    const investedFlat = sum('pay_flat');
    const investedStep = sum('pay_step');
    const last = data[data.length - 1];
    return {
      investedFlat,
      investedStep,
      finalFlat: last?.nominal_flat ?? 0,
      finalStep: last?.nominal_step ?? 0,
    };
  }, [data]);

  // CSV ダウンロード
  const downloadCsv = () => {
    const header = [
      'month',
      'deposit_flat', 'deposit_step',
      'balance_nominal_flat', 'balance_nominal_step',
      'balance_real_flat', 'balance_real_step',
    ];
    const lines = [header.join(',')];
    for (const r of data) {
      lines.push([
        r.m,
        r.pay_flat, r.pay_step,
        r.nominal_flat, r.nominal_step,
        r.real_flat, r.real_step,
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goal_sim_${months}m_apr${aprBase}_infl${inflationAnnualPct}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* KPI 的な概要 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="kpi">
          <div className="text-xs opacity-70">期間</div>
          <div className="text-lg font-semibold">{months} ヶ月</div>
        </div>
        <div className="kpi">
          <div className="text-xs opacity-70">最終残高（一定）</div>
          <div className="text-lg font-semibold">{totals.finalFlat.toLocaleString()} 円</div>
        </div>
        <div className="kpi">
          <div className="text-xs opacity-70">最終残高（段階）</div>
          <div className="text-lg font-semibold">{totals.finalStep.toLocaleString()} 円</div>
        </div>
        <div className="kpi">
          <div className="text-xs opacity-70">目標金額</div>
          <div className="text-lg font-semibold">{targetAmount.toLocaleString()} 円</div>
        </div>
      </div>

      {/* 操作用ボタン */}
      <div className="flex items-center gap-3">
        <button onClick={downloadCsv} className="btn">CSVで明細をダウンロード</button>
        <div className="text-sm text-white/70">
          投入総額（一定/段階）：{totals.investedFlat.toLocaleString()} / {totals.investedStep.toLocaleString()} 円
        </div>
      </div>

      {/* グラフ */}
      <div className="chart-wrap rounded-2xl border border-white/10 p-3 bg-panel/50">
        <div className="w-full h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <XAxis dataKey="m" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v/1000)}k` : String(v))} />
              <Tooltip formatter={(v: any) => Number(v).toLocaleString()} />
              <Legend />
              {/* 目標ライン（名目ベース） */}
              <ReferenceLine y={targetAmount} strokeDasharray="4 4" />

              {/* 名目残高 */}
              <Line type="monotone" dataKey="nominal_flat" name="名目：一定" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="nominal_step" name="名目：段階" dot={false} strokeWidth={2} />

              {/* 実質残高（インフレ控除） */}
              <Line type="monotone" dataKey="real_flat" name="実質：一定" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="real_step" name="実質：段階" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
