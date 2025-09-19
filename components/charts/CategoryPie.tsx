"use client";

import { useMemo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export type LogItem = {
  id: number;
  date: string;        // YYYY-MM-DD
  category: string | null;
  amount: number | null;
  is_income?: boolean | null;
};

export default function CategoryPie({ items }: { items: LogItem[] }) {
  // 支出だけをカテゴリ合計
  const { labels, values } = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) {
      if (it.is_income) continue; // 収入は除外
      const amt = Number(it.amount || 0);
      if (!amt) continue;
      const key = it.category || "未分類";
      map.set(key, (map.get(key) ?? 0) + amt);
    }
    const labels = Array.from(map.keys());
    const values = labels.map((k) => map.get(k) ?? 0);
    return { labels, values };
  }, [items]);

  if (!labels.length) {
    return <div className="text-sm text-muted-foreground">データがありません。</div>;
  }

  const data = {
    labels,
    datasets: [
      {
        label: "支出",
        data: values,
      },
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
            return `${ctx.label}: ${v.toLocaleString()}円`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64 sm:h-80">
      <Pie data={data} options={options} />
    </div>
  );
}
