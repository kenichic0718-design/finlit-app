"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export type TrendPoint = { label: string; out: number; inc: number };

export default function MonthlyTrend({ points }: { points: TrendPoint[] }) {
  const labels = useMemo(() => points.map((p) => p.label), [points]);
  const outs = useMemo(() => points.map((p) => Number(p.out || 0)), [points]);
  const incs = useMemo(() => points.map((p) => Number(p.inc || 0)), [points]);

  if (!points.length) {
    return <div className="text-sm text-muted-foreground">データがありません。</div>;
  }

  const data = {
    labels,
    datasets: [
      { label: "支出", data: outs, tension: 0.3 },
      { label: "収入", data: incs, tension: 0.3 },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false as const,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const v = Number(ctx.raw ?? 0);
            return `${ctx.dataset.label}: ${v.toLocaleString()}円`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v: any) => `${Number(v).toLocaleString()}円`,
        },
      },
    },
  };

  return (
    <div className="h-64 sm:h-80">
      <Line data={data} options={options} />
    </div>
  );
}
