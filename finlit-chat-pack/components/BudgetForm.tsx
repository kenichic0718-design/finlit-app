// /components/BudgetForm.tsx
"use client";

import React from "react";

type Kind = "expense" | "income";
type Category = { id: string; name: string; kind?: Kind };

export default function BudgetForm() {
  const [kind, setKind] = React.useState<Kind>("expense");
  const [month, setMonth] = React.useState<string>(getThisMonth());
  const [amount, setAmount] = React.useState<string>("");
  const [categoryId, setCategoryId] = React.useState<string>("");

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [info, setInfo] = React.useState<string>("");
  const [catError, setCatError] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  // ---- カテゴリ読み込み -----------------------------------------------------
  const loadCategories = React.useCallback(async (k: Kind) => {
    try {
      setCatError("");
      const res = await fetch(`/api/categories?kind=${k}`, { cache: "no-store" });
      let json: any = {};
      try {
        json = await res.json();
      } catch {
        /* noop */
      }
      const items = (json?.items ?? json?.data ?? []) as Category[];
      setCategories(Array.isArray(items) ? items : []);
      setCategoryId((prev) => prev || (items[0]?.id ?? ""));
      if (json?.guest) {
        setInfo("※ ログインで予算を保存できます（いまは試用モード）");
      }
      if (!res.ok && json?.error) {
        setCatError(`カテゴリ取得に失敗: ${json.error}`);
      }
    } catch (e: any) {
      setCategories([]);
      setCategoryId("");
      setCatError(`カテゴリ取得に失敗: ${e?.message ?? "unknown"}`);
    }
  }, []);

  React.useEffect(() => {
    loadCategories(kind);
  }, [kind, loadCategories]);

  // ---- 送信（/api/budgets） -------------------------------------------------
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCatError("");
    setInfo("");
    try {
      setSubmitting(true);

      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month, // "YYYY-MM"
          kind,
          category_id: categoryId,
          amount: Number(amount),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (json?.guest) {
        setInfo("ログインすると予算を保存できます（いまは試用モード）");
        return;
      }
      if (!json?.ok) {
        setCatError(`保存に失敗しました：${json?.error ?? "unknown"}`);
        return;
      }

      setAmount("");
      setInfo("保存しました");
      // 必要なら一覧再取得など
    } catch (err: any) {
      setCatError(`エラー：${err?.message ?? "unknown"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 月 */}
      <div className="max-w-xs">
        <label className="block text-sm mb-1">対象月</label>
        <input
          type="month"
          className="w-full rounded-md bg-neutral-800 px-3 py-2"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
        />
      </div>

      {/* 種別 */}
      <div className="flex gap-6 items-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            className="accent-blue-500"
            name="kind"
            value="expense"
            checked={kind === "expense"}
            onChange={() => setKind("expense")}
          />
          <span>支出</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            className="accent-blue-500"
            name="kind"
            value="income"
            checked={kind === "income"}
            onChange={() => setKind("income")}
          />
          <span>収入</span>
        </label>
      </div>

      {/* カテゴリ */}
      <div className="max-w-sm">
        <label className="block text-sm mb-1">カテゴリ（{kind === "expense" ? "支出" : "収入"}）</label>
        <select
          className="w-full rounded-md bg-neutral-800 px-3 py-2"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.length === 0 ? (
            <option value="">（カテゴリなし）</option>
          ) : (
            categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))
          )}
        </select>
        {catError && <p className="mt-2 text-xs text-red-400">{catError}</p>}
        {info && !catError && <p className="mt-2 text-xs opacity-70">{info}</p>}
      </div>

      {/* 金額 */}
      <div className="max-w-sm">
        <label className="block text-sm mb-1">金額（円）</label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="例）15000"
          className="w-full rounded-md bg-neutral-800 px-3 py-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      {/* 送信 */}
      <button
        type="submit"
        disabled={submitting || !month || !categoryId || !amount}
        className="rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2 disabled:opacity-50"
      >
        {submitting ? "保存中…" : "追加"}
      </button>
    </form>
  );
}

// ---- helpers ---------------------------------------------------
function getThisMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

