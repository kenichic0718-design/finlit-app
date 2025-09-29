// app/budgets/page.tsx
"use client";

import BudgetForm from "@/components/BudgetForm";

export default function BudgetsPage() {
  // 保存先 API がまだ無い場合はダミーで受けておく
  async function saveBudget(payload: { month: string; categoryId: string; amount: number }) {
    // ここで /api/budgets に POST する想定
    // await fetch("/api/budgets", { method: "POST", body: JSON.stringify(payload) });
    console.log("budget payload", payload);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">予算</h1>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">月次予算を追加</h2>
        <BudgetForm defaultKind="expense" onSubmit={saveBudget} />
      </div>

      {/* 予算一覧（あとで実装） */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">今月の予算（準備中）</h2>
        <p className="text-sm text-muted">保存 API をつないだら一覧を表示します。</p>
      </div>
    </div>
  );
}

