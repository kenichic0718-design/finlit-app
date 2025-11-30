// app/logs/ClientBoundary.tsx
"use client";

/**
 * 記録ページのクライアント側エントリポイント
 *
 * - App Router の Server Component から分離するための薄いラッパ
 * - 実際の UI / ロジックは _PageClient.tsx に集約
 */
import PageClient from "./_PageClient";

export default function ClientBoundary() {
  return <PageClient />;
}

