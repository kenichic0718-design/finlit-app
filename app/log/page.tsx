"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { monthLabels } from "@/lib/date";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Log = { id: number; date: string; category: string | null; amount: number; memo?: string | null; is_income?: boolean | null };
type Category = { id: string; name: string; kind: "expense"|"income"; color: string };

export default function LogPage() {
  const supabase = createClient();
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [amount, setAmount] = useState<number>(0);
  const [memo, setMemo] = useState<string>("");
  const [isIncome, setIsIncome] = useState(false);
  const [categoryName, setCategoryName] = useState<string>("食費");

  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("*").order("created_at",{ascending:true});
    setCategories((data||[]) as Category[]);
  }
  async function fetchLogs() {
    const y = new Date(date).getFullYear();
    const m = new Date(date).getMonth()+1;
    const ym = `${y}-${String(m).padStart(2,'0')}`;
    const { data } = await supabase.from("logs")
      .select("*").like("date", `${ym}%`).order("date",{ascending:true});
    setLogs((data||[]) as Log[]);
  }

  useEffect(()=>{ fetchCategories(); },[]);
  useEffect(()=>{ fetchLogs(); },[date]);

  async function add() {
    setLoading(true);
    const payload = { date, category: categoryName, amount, memo, is_income: isIncome };
    const { error } = await supabase.from("logs").insert(payload);
    setLoading(false);
    if (error) return alert("保存に失敗しました（詳細はコンソール）");
    setAmount(0); setMemo("");
    fetchLogs();
  }

  const monthBar = useMemo(()=>{
    const labels = ["食費","交通","日用品","交際","エンタメ","医療","教育","住居","光熱","通信","その他"];
    const by = new Map(labels.map(l=>[l,0]));
    for (const it of logs) {
      if (it.is_income) continue;
      const key = it.category || "その他";
      by.set(key, (by.get(key)||0) + Number(it.amount||0));
    }
    const catMap = new Map(categories.filter(c=>c.kind==='expense').map(c=>[c.name,c.color]));
    const usedLabels = [...by.keys()];
    const data = usedLabels.map(l=>by.get(l)||0);
    const bg = usedLabels.map(l=>catMap.get(l)||"#64748b");
    return { labels: usedLabels, data, bg };
  },[logs,categories]);

  const lineLabels = monthLabels(new Date(date));
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">記録</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)}
               className="px-3 py-2 rounded bg-gray-800 border border-gray-600"/>
        <select value={categoryName} onChange={(e)=>setCategoryName(e.target.value)}
                className="px-3 py-2 rounded bg-gray-800 border border-gray-600">
          {categories.map(c=>(
            <option key={c.id} value={c.name}>{c.name} {c.kind==='income'?'(収入)':''}</option>
          ))}
        </select>
        <input type="number" value={amount} onChange={(e)=>setAmount(Number(e.target.value||0))}
               className="w-24 px-3 py-2 rounded bg-gray-800 border border-gray-600"/>
        <input placeholder="メモ（任意）" value={memo} onChange={(e)=>setMemo(e.target.value)}
               className="flex-1 px-3 py-2 rounded bg-gray-800 border border-gray-600"/>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isIncome} onChange={(e)=>setIsIncome(e.target.checked)} />
          収入
        </label>
        <button onClick={add} disabled={loading}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50">追加</button>
      </div>

      <section className="p-4 rounded border border-gray-700">
        <h2 className="font-semibold mb-2">カテゴリ別（今月の支出）</h2>
        <Bar
          data={{ labels: monthBar.labels,
                  datasets: [{ label: "支出", data: monthBar.data, backgroundColor: monthBar.bg }] }}
          options={{ plugins:{legend:{display:false}}, scales:{ y:{ ticks:{ callback:(v)=>`${v}円` } } } }}
        />
      </section>

      <section className="space-y-2">
        {logs.map(l=>(
          <div key={l.id} className="px-3 py-2 rounded border border-gray-700 flex justify-between">
            <div>{l.date} <span className="text-gray-300">{l.category}</span> {l.memo?`- ${l.memo}`:''}</div>
            <div className={l.is_income ? "text-emerald-400":"text-gray-100"}>
              {l.is_income?"+":""}{Number(l.amount).toLocaleString()}円
            </div>
          </div>
        ))}
        {!logs.length && <div className="text-sm text-gray-400">今月の記録はまだありません。</div>}
      </section>
    </main>
  );
}
