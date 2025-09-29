'use client';

// app/budgets/page.tsx

import React from "react";
import BudgetForm from "@/components/BudgetForm";
import BudgetList from "@/components/BudgetList";

function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BudgetsPage() {
  const [month, setMonth] = React.useState(thisMonth());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">予算</h1>

      <div className="rounded border border-zinc-700/60 p-4">
        <h2 className="text-lg font-semibold mb-4">月次予算を追加</h2>
        <BudgetForm />
      </div>

      <div className="rounded border border-zinc-700/60 p-4">
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="text-lg font-semibold">今月の予算</h2>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700"
          />
        </div>
        <BudgetList month={month} />
      </div>
    </div>
  );
}

