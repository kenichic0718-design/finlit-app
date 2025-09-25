"use client";

import { useEffect, useState } from "react";

type Kind = "expense" | "income";
type Category = { id: string; name: string; kind: Kind };

export default function SettingsCategories() {
  const [expense, setExpense] = useState<Category[]>([]);
  const [income, setIncome] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ← ページ表示時に「支出」「収入」を同時に取得（トグルに依存しない）
  useEffect(() => {
    let abort = false;

    async function fetchAll() {
      setLoading(true);
      setErr(null);
      try {
        const qs = (k: string) => `/api/categories?kind=${k}`;
        const [eRes, iRes] = await Promise.all([fetch(qs("expense")), fetch(qs("income"))]);

        if (!eRes.ok || !iRes.ok) {
          const eText = !eRes.ok ? await eRes.text() : "";
          const iText = !iRes.ok ? await iRes.text() : "";
          throw new Error(`カテゴリ取得に失敗しました\n${eText || ""}\n${iText || ""}`.trim());
        }

        const eJson = await eRes.json();
        const iJson = await iRes.json();

        if (abort) return;
        setExpense(eJson.items ?? []);
        setIncome(iJson.items ?? []);
      } catch (e: any) {
        if (!abort) setErr(e?.message || "カテゴリ取得に失敗しました");
      } finally {
        if (!abort) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      abort = true;
    };
  }, []);

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="mb-3 text-lg font-semibold">支出カテゴリ</h3>
        {loading ? (
          <p className="text-sm text-white/60">読み込み中…</p>
        ) : err ? (
          <p className="text-sm text-red-400 whitespace-pre-wrap">{err}</p>
        ) : expense.length === 0 ? (
          <p className="text-sm text-white/60">まだありません</p>
        ) : (
          <ul className="space-y-2">
            {expense.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span>{c.name}</span>
                {/* 必要なら削除ボタンをここに */}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="mb-3 text-lg font-semibold">収入カテゴリ</h3>
        {loading ? (
          <p className="text-sm text-white/60">読み込み中…</p>
        ) : err ? (
          <p className="text-sm text-red-400 whitespace-pre-wrap">{err}</p>
        ) : income.length === 0 ? (
          <p className="text-sm text-white/60">まだありません</p>
        ) : (
          <ul className="space-y-2">
            {income.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span>{c.name}</span>
                {/* 必要なら削除ボタンをここに */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

