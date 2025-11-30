'use client';

import DashboardPage from './Client';

export default function DashboardPageClient() {
  // グラフ用の Recharts などは使わず、
  // 既存の Client.tsx にまとめてあるダッシュボード UI をそのまま表示する
  return <DashboardPage />;
}
