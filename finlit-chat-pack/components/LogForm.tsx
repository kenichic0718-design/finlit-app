// /components/LogForm.tsx
"use client";

import React from "react";

type Kind = "expense" | "income";
type Category = { id: string; name: string; kind?: Kind };

export default function LogForm() {
  const [kind, setKind] = React.useState<Kind>("expense");
  const [amount, setAmount] = React.useState<string>("");
  const [categoryId, setCategoryId] = React.useState<string>("");
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [message, setMessage] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  // ---- カテゴリ読み込み（/api/categories を想定） -------------------------
  const loadCategories = React.useCallback(async (k: Kind) => {
    try {
      setMessage("");
      const res = await fetch(`/api/categories?kind=${k}`, { cache: "no-store" });
      let json: any = {};
      try {
        json = await res.json();
      } catch {
        /* noop */
      }

      // 期待形: { ok:true, items:[...] } / 後方互換: data
      const items = (json?.items ?? json?.data ?? []) as Category[];
      setCategories(Array.isArray(items) ? items : []);
      // デフォルト選択（以前 prev があれば維持）
      setCategoryId((prev) => prev || (items[0]?.id ?? ""));
      if (json?.guest) {
        setMessage("※ ログインでカテゴリを保存できます（いまは試用モード）");
      }
      if (!res.ok && json?.error) {
        setMessage(`カテゴリ取得に失敗: ${json.error}`);
      }
    } catch (e: any) {
      setCategories([]);
      setCategoryId("");
      setMessage(`カテゴリ取得に失敗: ${e?.message ?? "unknown"}`);
    }
  }, []);

  React.useEffect(() => {
    loadCategories(kind);
  }, [kind, loadCategories]);

  // ---- 送信（/api/logs） ---------------------------------------------------
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      setSubmitting(true);

      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          category_id: categoryId,
          amount: Number(amount),
          // at は未指定ならサーバで now() 採用
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (json?.guest) {
        setMessage("ログインすると保存できます（いまは試用モードです）");
        return;
      }
      if (!json?.ok) {
        setMessage(`保存に失敗しました：${json?.error ?? "unknown"}`);
        return;
      }

      // 成功
      setAmount("");
      setMessage("保存しました");
      // 必要なら一覧の再取得などをここで
    } catch (err: any) {
      setMessage(`エラー：${err?.message ?? "unknown"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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

      {/* 金額 */}
      <div className="max-w-sm">
        <label className="block text-sm mb-1">金額</label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="例 500"
          className="w-full rounded-md bg-neutral-800 px-3 py-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      {/* カテゴリ */}
      <div className="max-w-sm">
        <label className="block text-sm mb-1">カテゴリ</label>
        <select
          className="w-full rounded-md bg-neutral-800 px-3 py-2"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.length === 0 ? (
            <option value="">（該当なし）</option>
          ) : (
            categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))
          )}
        </select>
        {message && <p className="mt-2 text-xs opacity-70">{message}</p>}
      </div>

      {/* 送信 */}
      <button
        type="submit"
        disabled={submitting || !amount || !categoryId}
        className="rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2 disabled:opacity-50"
      >
        {submitting ? "保存中…" : "記録する"}
      </button>
    </form>
  );
}

