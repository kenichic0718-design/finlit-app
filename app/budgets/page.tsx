"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { CANONICAL_CATEGORIES, normalizeCategory } from "../_constants/categories";
import { getCurrentProfileId } from "../_utils/getCurrentProfileId";

type BudgetRow = { id: number; category: string; amount: number; yyyymm: string };

function toYyyymm(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BudgetsPage() {
  const supabase = getSupabaseClient();
  const [profileId, setProfileId] = useState<string>("");
  const [month, setMonth] = useState<string>(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
  });
  const yyyymm = useMemo(() => month.replace("-", ""), [month]);

  const [category, setCategory] = useState<string>(CANONICAL_CATEGORIES[0]);
  const [amount, setAmount] = useState<string>("0");
  const [rows, setRows] = useState<BudgetRow[]>([]);

  useEffect(() => {
    (async () => {
      const pid = await getCurrentProfileId(supabase);
      setProfileId(pid);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, yyyymm]);

  async function refresh() {
    if (!profileId) return;
    const { data } = await supabase
      .from("budgets")
      .select("id, category, amount, yyyymm")
      .eq("profile_id", profileId)
      .eq("yyyymm", yyyymm)
      .order("id", { ascending: true });
    setRows((data as any) ?? []);
  }

  async function addOrReplace() {
    if (!profileId) {
      alert("profileId が未確定です。少し待ってから再度お試しください。");
      return;
    }
    const cat = normalizeCategory(category);

    // 同カテゴリ・同月を削除してから追加（安全策）
    await supabase
      .from("budgets")
      .delete()
      .eq("profile_id", profileId)
      .eq("yyyymm", yyyymm)
      .eq("category", cat);

    const { error } = await supabase.from("budgets").insert({
      profile_id: profileId,
      yyyymm,
      category: cat,
      amount: Number(amount || 0),
    });

    if (error) {
      alert(`保存に失敗しました: ${error.message}`);
      return;
    }
    setAmount("0");
    await refresh();
  }

  async function remove(id: number) {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) {
      alert(`削除に失敗しました: ${error.message}`);
      return;
    }
    await refresh();
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-bold">予算</h1>

      <div className="flex items-center gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-transparent border px-3 py-2 rounded"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-transparent border px-3 py-2 rounded"
        >
          {CANONICAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-transparent border px-3 py-2 rounded w-28"
          placeholder="金額"
        />
        <button
          onClick={addOrReplace}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          追加 / 上書き保存
        </button>
      </div>

      <div className="mt-4 border rounded">
        <table className="w-full text-sm">
          <thead className="opacity-70">
            <tr>
              <th className="text-left p-2">カテゴリ</th>
              <th className="text-right p-2">金額</th>
              <th className="text-right p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.category}</td>
                <td className="p-2 text-right">{r.amount.toLocaleString()}円</td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => remove(r.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3 opacity-70" colSpan={3}>
                  データがありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
