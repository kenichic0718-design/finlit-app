// components/BudgetList.tsx
"use client";

import { useEffect, useState } from "react";
import BudgetForm from "./BudgetForm";

type BudgetItem = {
  id: string;
  category_id: string;
  amount: number;
  categories: {
    id: string;
    name: string;
    kind: string;
  } | null;
};

function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BudgetList() {
  const [month, setMonth] = useState(thisMonth());
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/budgets?kind=list&ym=${month}`, {
      credentials: "include",
    });

    const json = await res.json();
    setItems(json?.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [month]);

  return (
    <div className="space-y-6">
      {/* 月選択 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">月の予算</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700"
        />
      </div>

      {/* 予算一覧 */}
      {loading ? (
        <p>読み込み中…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400">この月の予算は未設定です。</p>
      ) : (
        <ul className="space-y-2">
          {items.map((b) => (
            <li key={b.id} className="flex justify-between border-b border-zinc-700 py-2">
              <span>{b.categories?.name ?? "不明カテゴリ"}</span>
              <span className="font-semibold">{b.amount} 円</span>
            </li>
          ))}
        </ul>
      )}

      {/* 予算追加フォーム */}
      <div className="rounded border border-zinc-700 p-4">
        <h3 className="text-md font-semibold mb-2">予算を追加</h3>
        <BudgetForm month={month} onSaved={load} />
      </div>
    </div>
  );
}

