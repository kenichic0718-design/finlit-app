// components/GoalInflationChart.tsx
"use client";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

type Row = { m: number; nominal: number; real: number };
export default function GoalInflationChart({ data, target }: { data: Row[]; target: number }) {
  return (
    <div className="chart-wrap rounded-2xl border border-line p-3 bg-panel/50">
      <div className="text-sm opacity-80 mb-2">積立シミュレーション（名目/実質）</div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="m" tickFormatter={(v)=>`${v}m`} />
          <YAxis tickFormatter={(v)=>v.toLocaleString()} />
          <Tooltip formatter={(v: any)=>`${Math.round(v).toLocaleString()}円`} labelFormatter={(l)=>`${l}ヶ月`} />
          <Legend />
          <Line type="monotone" dataKey="nominal" name="名目" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="real" name="実質(購買力換算)" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-muted">目標：{target.toLocaleString()}円（名目）</div>
    </div>
  );
}

