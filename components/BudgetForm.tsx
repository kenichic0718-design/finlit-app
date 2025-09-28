// components/BudgetForm.tsx
"use client";

import * as React from "react";
import { toast } from "@/components/ToastHost";

type Cat = { id: string; name: string };
type GetRes = { ok: boolean; guest?: boolean; items: Cat[] };

function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BudgetForm() {
  const [month, setMonth] = React.useState(thisMonth());
  const [kind, setKind] = React.useState<"expense" | "income">("expense");
  const [cats, setCats] = React.useState<Cat[]>([]);
  const [categoryId, setCategoryId] = React.useState("");
  const [amount, setAmount] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [guest, setGuest] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(`/api/categories?kind=${kind}`, { cache: "no-store" });
      const json: GetRes = await res.json();
      if (!alive) return;
      setCats(json.items ?? []);
      setGuest(Boolean(json.guest));
      if (!categoryId && json.items?.length) setCategoryId(json.items[0].id);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (guest) return toast("保存するにはサインインしてください");
    if (!/^\d{4}-\d{2}$/.test(month)) return toast("対象月は YYYY-MM で指定してください");
    if (!categoryId) return toast("カテゴリを選択してください");
    const n = Number(amount);
    if (!(Number.isFinite(n) && n >= 0)) return toast("金額は0以上の数値で入力してください");

    try {
      setLoading(true);
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, kind, category_id: categoryId, amount: n }),
      });
      const json = await res.json();
      if (!json?.ok) return toast(json?.error ?? "保存に失敗しました");
      toast("予算を保存しました");
      setAmount("");
      window.dispatchEvent(new CustomEvent("finlit:budgets:saved", { detail: { month } }));
    } catch {
      toast("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* 対象月 */}
      <div className="space-y-1">
        <label className="block text-sm text-zinc-400">対象月</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full px-2 py-2 rounded bg-zinc-900 border border-zinc-700"
        />
      </div>

      {/* 種別 */}
      <div className="space-y-1">
        <label className="block text-sm text-zinc-400">種別</label>
        <div className="flex gap-6">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="kind" value="expense" checked={kind === "expense"} onChange={() => setKind("expense")} />
            支出
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="kind" value="income" checked={kind === "income"} onChange={() => setKind("income")} />
            収入
          </label>
        </div>
      </div>

      {/* カテゴリ */}
      <div className="space-y-1">
        <label className="block text-sm text-zinc-400">カテゴリ（{kind === "expense" ? "支出" : "収入"}）</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-2 py-2 rounded bg-zinc-900 border border-zinc-700"
        >
          {cats.length === 0 ? (
            <option value="">{loading ? "読み込み中…" : "(該当なし)"}</option>
          ) : (
            cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))
          )}
        </select>
        <p className="text-xs text-zinc-500 mt-1">※ ログイン中のみ保存できます（未ログイン時は候補のみ表示）</p>
      </div>

      {/* 金額 */}
      <div className="space-y-1">
        <label className="block text-sm text-zinc-400">金額（円）</label>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="例）15000"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
          className="w-full px-2 py-2 rounded bg-zinc-900 border border-zinc-700"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded border border-zinc-700 hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "保存中…" : "追加"}
        </button>
      </div>
    </form>
  );
}

