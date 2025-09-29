"use client";

import React, { useEffect, useMemo, useState } from "react";

type Kind = "expense" | "income";
type Category = { id: string; name: string; kind: Kind };

export default function BudgetForm() {
  // ーー 画面状態 ーーーーーーーーーーーーーーーーーーーーーーー
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${m}`;
  });
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ーー カテゴリ取得（共通 API を使用） ーーーーーーーーーーーーーー
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    let abort = false;
    (async () => {
      setMsg(null);
      try {
        const res = await fetch("/api/categories?select=id,name,kind", { cache: "no-store" });
        if (!res.ok) throw new Error("カテゴリ取得に失敗しました");
        const json = (await res.json()) as { ok: boolean; categories: Category[] };
        if (!json.ok) throw new Error("カテゴリ取得に失敗しました");
        if (!abort) setCategories(json.categories);
      } catch (e: any) {
        if (!abort) setMsg(e?.message ?? "カテゴリ取得に失敗しました");
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  // 予算は「支出カテゴリ」のみを対象
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.kind === "expense"),
    [categories]
  );

  // ーー 送信 ーーーーーーーーーーーーーーーーーーーーーーーーーー
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!categoryId) return setMsg("カテゴリを選んでください");
    if (!amount || isNaN(Number(amount))) return setMsg("金額を正しく入力してください");

    try {
      setLoading(true);
      const body = {
        yyyymm: month.replace("-", ""),
        categoryId,
        amount: Number(amount),
      };
      const res = await fetch("/api/budgets/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "登録に失敗しました");
      setMsg("予算を保存しました");
      setAmount("");
      // 必要なら一覧の再取得など
    } catch (e: any) {
      setMsg(e?.message ?? "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  // ーー UI ーーーーーーーーーーーーーーーーーーーーーーーーーーー
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">対象月</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="input"
          required
        />
      </div>

      <div>
        <label className="block text-sm mb-1">カテゴリ（支出）</label>
        <select
          className="input"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">（選択なし）</option>
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">金額（円）</label>
        <input
          type="number"
          inputMode="numeric"
          className="input"
          placeholder="例）15000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <button className="btn" disabled={loading}>
        {loading ? "保存中…" : "追加"}
      </button>

      {msg && <p className="text-sm text-muted">{msg}</p>}
    </form>
  );
}

