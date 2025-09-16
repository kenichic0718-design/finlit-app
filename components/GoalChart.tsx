"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Chart.js の各要素を登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface GoalChartProps {
  targetAmount: number; // 目標金額
  months: number;       // 期間（月）
  annualRate: number;   // 想定年率 (%)
}

export default function GoalChart({ targetAmount, months, annualRate }: GoalChartProps) {
  // 毎月の積立金額を計算（単純化）
  const monthlySaving = targetAmount / months;

  // データ生成
  const labels = Array.from({ length: months }, (_, i) => `${i + 1}m`);
  const data = Array.from({ length: months }, (_, i) =>
    Math.round(monthlySaving * (i + 1))
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "目標進捗（単純積立）",
        data,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "積立シミュレーション" },
    },
  };

  return <Line data={chartData} options={options} />;
}

