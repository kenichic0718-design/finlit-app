"use client";

import React, { useEffect, useState, useCallback } from "react";

type Kind = "expense" | "income";
type Category = { id: string; name: string; kind: Kind };

export default function SettingsCategories() {
  const [expense, setExpense] = useState<Category[]>([]);
  const [income, setIncome] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // 2種類いっぺんに取得
  const loadAll = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const qs = (k: Kind) => `/api/categories?kind=${k}`;
      const [eRes, iRes] = await Promise.all([fetch(qs("expense")), fetch(qs("income"))]);

      if (!eRes.ok || !iRes.ok) {
        const eText = !eRes.ok ? await eRes.text() : "";
        const iText = !iRes.ok ? await iRes.text() : "";
        throw new Error(`カテゴリ取得に失敗しました\n${eText}\n${iText}`.trim());
      }

      const eJson = (await eRes.json()) as { ok: boolean; items: Category[] };
      const iJson = (await iRes.json()) as { ok: boolean; items: Category[] };

      setExpense(eJson.items ?? []);
      setIncome(iJson.items ?? []);
    } catch (e: any) {
      setErr(e?.message || "カテゴリ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadAll();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  // --------------- 操作（名称変更・削除）---------------
  const renameCategory = async (cat: Category) => {
    const name = window.prompt("新しい名称を入力してください", cat.name);
    if (!name || name.trim() === "" || name.trim() === cat.name) return;

    const res = await fetch(`/api/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      const t = await res.text();
      alert(`名称変更に失敗しました\n${t}`);
      return;
    }
    await loadAll();
  };

  const deleteCategory = async (cat: Category) => {
    if (!window.confirm(`「${cat.name}」を削除します。よろしいですか？`)) return;
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    if (!res.ok) {
      const t = await res.text();
      alert(`削除に失敗しました\n${t}`);
      return;
    }
    await loadAll();
  };

  // --------------- 表示 ---------------
  const renderList = (list: Category[]) => {
    if (loading) return <p className="text-sm text-white/60">読み込み中…</p>;
    if (err) return <p className="text-sm text-red-400 whitespace-pre-wrap">{err}</p>;
    if (list.length === 0) return <p className="text-sm text-white/60">まだありません</p>;

    return (
      <ul className="space-y-2">
        {list.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
          >
            <span className="truncate">{c.name}</span>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-white/15 px-2 py-1 text-xs hover:bg-white/10"
                onClick={() => renameCategory(c)}
                aria-label={`${c.name} を名称変更`}
              >
                名称変更
              </button>
              <button
                className="rounded-lg border border-red-400/30 px-2 py-1 text-xs text-red-300 hover:bg-red-400/10"
                onClick={() => deleteCategory(c)}
                aria-label={`${c.name} を削除`}
              >
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="mb-3 text-lg font-semibold">支出カテゴリ</h3>
        {renderList(expense)}
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="mb-3 text-lg font-semibold">収入カテゴリ</h3>
        {renderList(income)}
      </div>
    </div>
  );
}
