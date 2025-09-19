"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { getCurrentProfileId } from "../_utils/getCurrentProfileId";
import { fetchBudgetVsActualRows, calcTotals, VRow } from "../_utils/budgetVsActualView";

function toYyyymm(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}${String(m).padStart(2, "0")}`;
}

function toMonthStartISO(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

export default function DashboardPage() {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<VRow[]>([]);
  const [profileId, setProfileId] = useState<string>("");
  const [monthDate, setMonthDate] = useState<Date>(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const yyyymm = useMemo(() => toYyyymm(monthDate), [monthDate]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const pid = await getCurrentProfileId(supabase);
        setProfileId(pid);

        const { rows } = await fetchBudgetVsActualRows({ profileId: pid, yyyymm });
        setRows(rows);
      } catch (e: any) {
        alert(`ダッシュボード取得失敗: ${e?.message ?? e}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase, yyyymm]);

  const { budgetTotal, actualTotal, progress } = useMemo(
    () => calcTotals(rows),
    [rows]
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>

        <div className="flex items-center gap-2">
          <button
            className="rounded border px-2 py-1"
            onClick={() =>
              setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
            }
          >
            ←
          </button>

          <input
            type="month"
            value={`${monthDate.getFullYear()}-${String(
              monthDate.getMonth() + 1
            ).padStart(2, "0")}`}
            onChange={(e) => {
              const [y, m] = e.currentTarget.value.split("-").map(Number);
              setMonthDate(new Date(y, (m ?? 1) - 1, 1));
            }}
            className="rounded border px-2 py-1"
          />

          <button
            className="rounded border px-2 py-1"
            onClick={() =>
              setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
            }
          >
            →
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-neutral-400">
        期間: {toMonthStartISO(monthDate)} 〜 / 予算: {budgetTotal.toLocaleString()}円・実績:{" "}
        {actualTotal.toLocaleString()}円・進捗: {progress}%
      </p>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-900">
            <tr>
              <th className="px-4 py-2 text-left">カテゴリ</th>
              <th className="px-4 py-2 text-right">予算</th>
              <th className="px-4 py-2 text-right">実績</th>
              <th className="px-4 py-2 text-right">差額(予算-実績)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4" colSpan={4}>
                  読み込み中…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4" colSpan={4}>
                  この月のデータがありません。まずは「予算」や「記録」を追加してみてください。
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const diff = (r.budget_amount ?? 0) - (r.actual_amount ?? 0);
                return (
                  <tr key={`${r.category}-${r.yyyymm}`}>
                    <td className="border-t px-4 py-2">{r.category}</td>
                    <td className="border-t px-4 py-2 text-right">
                      {r.budget_amount.toLocaleString()}円
                    </td>
                    <td className="border-t px-4 py-2 text-right">
                      {r.actual_amount.toLocaleString()}円
                    </td>
                    <td
                      className={`border-t px-4 py-2 text-right ${
                        diff < 0 ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {diff.toLocaleString()}円
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

