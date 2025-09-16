"use client";
import { useMemo } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

type Point = { label: string; out: number; inc: number };

export default function MonthlyTrend({ points }: { points: Point[] }) {
  const { labels, outs, incs } = useMemo(() => {
    const labels = points.map((p) => p.label);
    const outs = points.map((p) => Number(p.out || 0));
    const incs = points.map((p) => Number(p.inc || 0));
    return { labels, outs, incs };
  }, [points]);

  if (!points.length) {
    return <div className="text-sm text-muted-foreground">データがありません。</div>;
  }

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "支出",
            data: outs,
            borderWidth: 2,
            pointRadius: 0,
            borderColor: "#f87171"
          },
          {
            label: "収入",
            data: incs,
            borderWidth: 2,
            pointRadius: 0,
            borderColor: "#34d399"
          }
        ]
      }}
      options={{
        responsive: true,
        plugins: { legend: { position: "top" } },
        scales: {
          y: { ticks: { callback: (v) => `${v}円` } }
        },
        elements: { line: { tension: 0.25 } }
      }}
    />
  );
}

