"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentProfileId } from "../_utils/getCurrentProfileId";

type Category = { id: string; name: string; kind: "expense" | "income"; color: string };
type BudgetRow = { id: number; category: string; amount: number; yyyymm: string };

export default function BudgetsPage() {
  const [yyyymm, setYyyymm] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}${m}`;
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [catInput, setCatInput] = useState<string>("");
  const [amountInput, setAmountInput] = useState<number>(4000);
  const [loading, setLoading] = useState<boolean>(false);

  const ymLabel = useMemo(() => {
    return `${yyyymm.slice(0, 4)}年${yyyymm.slice(4, 6)}月`;
  }, [yyyymm]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // カテゴリの読み込み
        const { data: cats, error: cErr } = await supabase
          .from("categories")
          .select("id,name,kind,color")
          .order("name", { ascending: true });

        if (cErr) throw cErr;
        setCategories(cats ?? []);

        // 予算の読み込み
        const profileId = await getCurrentProfileId();
        const { data: b, error: bErr } = await supabase
          .from("budgets")
          .select("id,category,amount,yyyymm")
          .eq("profile_id", profileId)
          .eq("yyyymm", yyyymm)
          .order("category", { ascending: true });

        if (bErr) throw bErr;
        setBudgets(b ?? []);
      } catch (e: any) {
        alert(`予算データ取得失敗: ${e?.message ?? e}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [yyyymm]);

  const addBudget = async () => {
    if (!catInput) {
      alert("カテゴリを選択してください");
      return;
    }
    if (!amountInput || amountInput <= 0) {
      alert("金額を入力してください");
      return;
    }
    setLoading(true);
    try {
      const profileId = await getCurrentProfileId();
      const { error } = await supabase.from("budgets").insert({
        profile_id: profileId,
        category: catInput,
        amount: amountInput,
        yyyymm,
      });
      if (error) throw error;

      // 追加後に再読込
      const { data: b2, error: rErr } = await supabase
        .from("budgets")
        .select("id,category,amount,yyyymm")
        .eq("profile_id", profileId)
        .eq("yyyymm", yyyymm)
        .order("category", { ascending: true });

      if (rErr) throw rErr;
      setBudgets(b2 ?? []);
      setAmountInput(0);
    } catch (e: any) {
      alert(`保存に失敗しました: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-slate-200">
      <h1 className="mb-6 text-2xl font-bold">予算</h1>

      <section className="mb-6 space-y-2">
        <label className="block text-sm opacity-80">対象: {ymLabel}</label>
        <div className="flex items-center gap-3">
          <select
            className="rounded bg-slate-800 px-3 py-2"
            value={`${yyyymm.slice(0, 4)}-${yyyymm.slice(4, 6)}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-");
              setYyyymm(`${y}${m}`);
            }}
          >
            {Array.from({ length: 36 }).map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              const val = `${y}-${m}`;
              return (
                <option key={val} value={val}>
                  {y}年{m}月
                </option>
              );
            })}
          </select>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 text-lg font-semibold">追加</div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded bg-slate-800 px-3 py-2"
            value={catInput}
            onChange={(e) => setCatInput(e.target.value)}
          >
            <option value="">カテゴリを選択</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="w-32 rounded bg-slate-800 px-3 py-2"
            value={amountInput}
            onChange={(e) => setAmountInput(Number(e.target.value))}
            placeholder="金額"
          />
          <button
            onClick={addBudget}
            disabled={loading}
            className="rounded bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500 disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 text-lg font-semibold">この月のデータ</div>
        {loading ? (
          <div className="opacity-80">読み込み中…</div>
        ) : budgets.length === 0 ? (
          <div className="opacity-80">この月のデータがありません。まずは予算を追加してみてください。</div>
        ) : (
          <table className="w-full table-fixed border-separate border-spacing-y-2">
            <thead className="text-left opacity-80">
              <tr>
                <th className="w-1/2">カテゴリ</th>
                <th className="w-1/2">予算</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => (
                <tr key={b.id} className="rounded bg-slate-800">
                  <td className="px-3 py-2">{b.category}</td>
                  <td className="px-3 py-2">{b.amount.toLocaleString()} 円</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

