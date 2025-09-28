// components/LogForm.tsx
"use client";
import * as React from "react";
import { toast } from "@/components/ToastHost";

type Cat = { id: string; name: string };
type GetRes = { ok: boolean; guest?: boolean; items: Cat[] };

function isoLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function LogForm() {
  const [kind, setKind] = React.useState<"expense" | "income">("expense");
  const [cats, setCats] = React.useState<Cat[]>([]);
  const [categoryId, setCategoryId] = React.useState("");
  const [amount, setAmount] = React.useState<string>("");
  const [date, setDate] = React.useState(isoLocal(new Date()));
  const [memo, setMemo] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [guest, setGuest] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const r = await fetch(`/api/categories?kind=${kind}`, { cache: "no-store" });
      const j: GetRes = await r.json();
      if (!alive) return;
      setCats(j.items ?? []);
      setGuest(Boolean(j.guest));
      if (!categoryId && j.items?.length) setCategoryId(j.items[0].id);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (guest) return toast("記録するにはサインインしてください");
    if (!categoryId) return toast("カテゴリを選択してください");
    const n = Number(amount);
    if (!(Number.isFinite(n) && n >= 0)) return toast("金額は0以上の数値で入力してください");

    try {
      setLoading(true);
      const at = new Date(`${date}T00:00:00`);
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, category_id: categoryId, amount: n, at, memo }),
      });
      const json = await res.json();
      if (!json?.ok) return toast(json?.error ?? "保存に失敗しました");
      toast("記録を保存しました");
      setAmount("");
      setMemo("");
      window.dispatchEvent(new CustomEvent("finlit:logs:saved", { detail: { at: date } }));
    } catch {
      toast("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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

      {/* 金額 */}
      <div className="space-y-1">
        <label className="block text-sm text-zinc-400">金額（円）</label>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="例）500"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
          className="w-full px-2 py-2 rounded bg-zinc-900 border border-zinc-700"
        />
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
            <option value="">{/* 既存の UI に合わせて */}(該当なし)</option>
          ) : (
            cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* 日付 */}
      <div className="space-y-1">
        <label className="block text-sm text-zinc-400">日付</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-2 py-2 rounded bg-zinc-900 border border-zinc-700"
        />
      </div>

      {/* メモ */}
      <div className="space-y-1">
        <label className="block text-sm text-zinc-400">メモ（任意）</label>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="例）昼食"
          className="w-full px-2 py-2 rounded bg-zinc-900 border border-zinc-700"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded border border-zinc-700 hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "保存中…" : "記録する"}
        </button>
      </div>
    </form>
  );
}

