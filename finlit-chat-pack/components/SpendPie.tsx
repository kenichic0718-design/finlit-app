"use client";

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

type Props = {
  byCategory: { category: string; amount: number }[];
};

export default function SpendPie({ byCategory }: Props) {
  if (!byCategory.length) return <p className="text-sm text-gray-400">データがありません。</p>;

  const data = {
    labels: byCategory.map((x) => x.category),
    datasets: [
      {
        data: byCategory.map((x) => x.amount),
        backgroundColor: [
          "rgba(59,130,246,0.6)",
          "rgba(34,197,94,0.6)",
          "rgba(244,114,182,0.6)",
          "rgba(250,204,21,0.6)",
          "rgba(168,85,247,0.6)",
          "rgba(248,113,113,0.6)",
          "rgba(45,212,191,0.6)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    plugins: {
      legend: { position: "bottom" as const, labels: { color: "#cbd5e1" } },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="w-full max-w-md">
      <Doughnut data={data} options={options} />
    </div>
  );
}

