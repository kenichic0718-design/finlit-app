// components/BudgetForm.tsx
"use client";

import { useState, useEffect } from "react";

type Category = {
  id: string;
  name: string;
  kind: "expense" | "income";
};

type Props = {
  month: string;      // "YYYY-MM"
  onSaved?: () => void;
};

export default function BudgetForm({ month, onSaved }: Props) {
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  // カテゴリ取得
  async function loadCategories() {
    const res = await fetch(`/api/categories?kind=${kind}`, {
      credentials: "include",
    });

    const json = await res.json();
    setCategories(json?.items ?? []);
  }

  useEffect(() => {
    loadCategories();
    setCategoryId("");
  }, [kind]);

  // 送信
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (!categoryId) {
      alert("カテゴリを選択してください。");
      return;
    }
    if (!amount) {
      alert("金額を入力してください。");
      return;
    }

    setBusy(true);

    const payload = {
      // ★ budgets テーブル / API 契約に合わせる
      month,                                // NOT NULL の month カラム用
      category_id: categoryId,
      amount_int: Number(amount) || 0,      // もともとの命名に合わせる
    };

    console.debug("[budgets] POST payload:", payload);

    const res = await fetch("/api/budgets", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    console.debug("[budgets] POST result:", json);

    setBusy(false);

    if (!json?.ok) {
      alert(
        "保存に失敗しました: " +
          (json?.error ?? "server") +
          (json?.detail ? ` (${json.detail})` : "")
      );
      return;
    }

    setAmount("");
    onSaved?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* 支出 / 収入 切り替え（カテゴリ取得用） */}
      <select
        className="select"
        value={kind}
        onChange={(e) => setKind(e.target.value as "expense" | "income")}
      >
        <option value="expense">支出カテゴリ</option>
        <option value="income">収入カテゴリ</option>
      </select>

      {/* カテゴリ */}
      <select
        className="select"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        <option value="">（カテゴリを選択）</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* 金額 */}
      <input
        className="input"
        type="number"
        placeholder="金額"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {/* 追加ボタン */}
      <button className="btn-primary" disabled={busy}>
        {busy ? "追加中…" : "追加"}
      </button>
    </form>
  );
}

