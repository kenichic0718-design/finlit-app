"use client";

import {
  Chart as ChartJS,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type Props = {
  months: string[]; // "YYYY-MM"
  amounts: number[]; // 各月の支出合計
};

export default function SpendTrend({ months, amounts }: Props) {
  if (!months.length) return <p className="text-sm text-gray-400">データがありません。</p>;

  const data = {
    labels: months.map((m) => m.replace("-", "/")),
    datasets: [
      {
        label: "支出",
        data: amounts,
        backgroundColor: "rgba(59,130,246,0.6)",
        borderWidth: 0,
      },
    ],
  };

  const options = {
    plugins: {
      legend: { labels: { color: "#cbd5e1" } },
      tooltip: { enabled: true },
    },
    scales: {
      x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.15)" } },
      y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.15)" } },
    },
  };

  return <Bar data={data} options={options} />;
}

