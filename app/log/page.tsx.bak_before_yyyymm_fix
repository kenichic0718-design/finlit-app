"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
const supabase = getSupabaseClient();
import { getCurrentProfileId } from "../_utils/getCurrentProfileId";

type Row = {
  id: number;
  date: string | null;
  ymd: string;
  category: string;
  amount: number;        // DBには常に正
  memo: string | null;
  is_income: boolean;
};

const CATEGORIES = ["食費", "日用品", "通信", "交通", "娯楽", "その他"];

function toYmd(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function toYYYYMM(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

export default function LogPage() {
  const [profileId, setProfileId] = useState<string>("");
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  });
  const [category, setCategory] = useState<string>("食費");
  const [amount, setAmount] = useState<string>("0");
  const [isIncome, setIsIncome] = useState<boolean>(false);
  const [rows, setRows] = useState<Row[]>([]);
  const currentYYYYMM = useMemo(() => toYYYYMM(date), [date]);

  useEffect(() => {
    (async () => {
      const pid = await getCurrentProfileId();
      setProfileId(pid);
    })();
  }, []);

  const fetchThisMonth = async () => {
    if (!profileId) return;
    const start = `${currentYYYYMM.slice(0, 4)}-${currentYYYYMM.slice(4, 6)}-01`;
    const endBase = new Date(start);
    endBase.setMonth(endBase.getMonth() + 1);
    const end = `${endBase.getFullYear()}-${String(endBase.getMonth() + 1).padStart(2, "0")}-01`;

    const { data, error } = await supabase
      .from("logs")
      .select("*")
      .eq("profile_id", profileId)
      .gte("ymd", start)
      .lt("ymd", end)
      .order("ymd", { ascending: false });

    if (error) {
      alert(`取得に失敗しました: ${error.message}`);
      console.error(error);
      return;
    }
    setRows((data as Row[]) ?? []);
  };

  useEffect(() => {
    fetchThisMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, currentYYYYMM]);

  const onAdd = async () => {
    if (!profileId) return;
    const ymd = toYmd(date);
    const yyyymm = toYYYYMM(date);
    const amt = Math.abs(Number(amount) || 0);  // 常に正で保存

    const payload = {
      profile_id: profileId,
      date: ymd,
      ymd,
      yyyymm,
      category,
      amount: amt,
      memo: null,
      is_income: isIncome,
    };

    const { error } = await supabase.from("logs").insert(payload);
    if (error) {
      alert(`保存に失敗しました: ${error.message}`);
      console.error(error);
      return;
    }
    setAmount("0");
    await fetchThisMonth();
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">収支記録</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-transparent border rounded px-3 py-2"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-transparent border rounded px-3 py-2"
        >
          {CATEGORIES.map((c) => (
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
          className="bg-transparent border rounded px-3 py-2 w-28 text-right"
        />

        <label className="inline-flex items-center gap-2 ml-2">
          <input
            type="checkbox"
            checked={isIncome}
            onChange={(e) => setIsIncome(e.target.checked)}
          />
          収入として記録する
        </label>

        <button
          onClick={onAdd}
          className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2"
        >
          追加
        </button>
      </div>

      <ul className="space-y-2 text-sm">
        {rows.map((r) => (
          <li key={r.id}>
            {r.ymd} [{r.is_income ? "収入" : "支出"}] {r.category}：{Math.abs(r.amount)}円
          </li>
        ))}
      </ul>
    </main>
  );
}

