// app/budgets/ClientBoundary.tsx
"use client";

import PageClient from "./_PageClient";

/**
 * Server Component からクライアント側の実装へ橋渡しするだけの薄いラッパ。
 * 将来 Suspense / ErrorBoundary を挟みたくなったとき用の拡張ポイント。
 */
export default function ClientBoundary() {
  return <PageClient />;
}

