"use client";
import { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

type LogItem = {
  category?: string | null;
  amount?: number | null;
  is_income?: boolean | null; // 収入/支出の区別が渡ってきても無視（このチャートは支出の割合）
};

export default function CategoryPie({ items }: { items: LogItem[] }) {
  const { labels, values } = useMemo(() => {
    const byCat = new Map<string, number>();
    for (const it of items ?? []) {
      // 支出のみ集計（is_income が true のものは除外）
      if (it?.is_income) continue;
      const cat = (it?.category ?? "未分類").trim() || "未分類";
      const amt = Number(it?.amount ?? 0);
      if (!Number.isFinite(amt) || amt <= 0) continue;
      byCat.set(cat, (byCat.get(cat) ?? 0) + amt);
    }
    const labels = [...byCat.keys()];
    const values = labels.map((l) => byCat.get(l) ?? 0);
    return { labels, values };
  }, [items]);

  if (!labels.length) {
    return (
      <div className="text-sm text-muted-foreground">
        データがありません。
      </div>
    );
  }

  // 視認性の高い色（十分なコントラスト）
  const palette = [
    "#60a5fa", // blue-400
    "#f87171", // red-400
    "#34d399", // emerald-400
    "#fbbf24", // amber-400
    "#a78bfa", // violet-400
    "#f472b6", // pink-400
    "#fb7185", // rose-400
    "#22c55e", // green-500
    "#06b6d4", // cyan-500
    "#f59e0b", // amber-500
    "#c084fc", // violet-300
  ];

  return (
    <Pie
      data={{
        labels,
        datasets: [
          {
            label: "支出",
            data: values,
            backgroundColor: labels.map((_, i) => palette[i % palette.length]),
            borderColor: "#111827", // dark gray-900
            borderWidth: 1,
          },
        ],
      }}
      options={{
        plugins: {
          legend: { position: "top", labels: { boxWidth: 14 } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = Number(ctx.parsed ?? 0);
                const total = values.reduce((a, b) => a + b, 0);
                const pct = total ? ((v / total) * 100).toFixed(1) : "0.0";
                return `${ctx.label}: ${v.toLocaleString()}円 (${pct}%)`;
              },
            },
          },
        },
      }}
    />
  );
}

