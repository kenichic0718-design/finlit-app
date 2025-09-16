"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { monthLabels, monthRange } from "@/lib/date";
import CategoryPie from "@/components/charts/CategoryPie";
import MonthlyTrend from "@/components/charts/MonthlyTrend";

type Log = { id: number; date: string; category: string | null; amount: number; is_income?: boolean | null };
type Category = { id: string; name: string; kind: "expense"|"income"; color: string };

export default function DashboardPage() {
  const supabase = createClient();
  const [dateStr, setDateStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}年${String(d.getMonth()+1).padStart(2,"0")}月`;
  });
  const [logs, setLogs] = useState<Log[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  async function fetchAll() {
    // categories
    const { data: cats } = await supabase.from("categories").select("*");
    setCategories((cats||[]) as Category[]);

    // month logs
    const now = new Date();
    const { start, end } = monthRange(now);
    const { data } = await supabase.from("logs")
      .select("*")
      .gte("date", start.toISOString().slice(0,10))
      .lte("date", end.toISOString().slice(0,10))
      .order("date",{ascending:true});
    setLogs((data||[]) as Log[]);
  }
  useEffect(()=>{ fetchAll(); },[]);

  const totalOut = useMemo(()=> logs.filter(l=>!l.is_income).reduce((s,l)=>s+Number(l.amount||0),0),[logs]);
  const totalInc = useMemo(()=> logs.filter(l=> l.is_income).reduce((s,l)=>s+Number(l.amount||0),0),[logs]);
  const net = totalInc - totalOut;

  const labels = monthLabels(new Date());
  const trend = useMemo(()=>{
    const byDay = new Map(labels.map(l=>[l,{out:0,inc:0}]));
    for (const l of logs) {
      const d = new Date(l.date);
      const key = `${d.getDate()}日`;
      const cur = byDay.get(key)!;
      if (l.is_income) cur.inc += Number(l.amount||0);
      else cur.out += Number(l.amount||0);
    }
    return labels.map(l=>({ label:l, out: byDay.get(l)!.out, inc: byDay.get(l)!.inc }));
  },[logs,labels]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex gap-3">
        <Link href="/dashboard" className="px-3 py-1 rounded bg-blue-700 text-white">ダッシュボード</Link>
        <Link href="/learn" className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white">学ぶ</Link>
        <Link href="/log" className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white">記録</Link>
        <Link href="/goal" className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white">目標</Link>
        <Link href="/budgets" className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white">予算</Link>
        <Link href="/categories" className="ml-auto px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white">カテゴリ管理</Link>
      </header>

      <h1 className="text-2xl font-bold">FinLit PWA</h1>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded border border-gray-700">
          <div className="text-sm text-gray-400">今月の支出</div>
          <div className="text-3xl font-bold">{totalOut.toLocaleString()}円</div>
        </div>
        <div className="p-4 rounded border border-gray-700">
          <div className="text-sm text-gray-400">今月の収入</div>
          <div className="text-3xl font-bold">{totalInc.toLocaleString()}円</div>
        </div>
        <div className="p-4 rounded border border-gray-700">
          <div className="text-sm text-gray-400">収支</div>
          <div className={`text-3xl font-bold ${net<0?'text-rose-400':'text-emerald-400'}`}>
            {net.toLocaleString()}円
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="p-4 rounded border border-gray-700">
          <h2 className="font-semibold mb-2">カテゴリ別（支出の割合）</h2>
          <CategoryPie items={logs} categories={categories}/>
        </div>
        <div className="p-4 rounded border border-gray-700">
          <h2 className="font-semibold mb-2">予算 vs 実績（今月）</h2>
          <MonthlyTrend points={trend}/>
        </div>
      </section>
    </main>
  );
}
