// app/logs/_LogForm.tsx
"use client";

import { useState } from "react";

function ymOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function yen(n: number | null | undefined) {
  return (Math.round(n ?? 0)).toLocaleString("ja-JP") + "円";
}

export default function LogForm() {
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [ym, setYm] = useState<string>(ymOf(new Date()));
  const [date, setDate] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  async function submit() {
    const cal_date = new Date(date || `${ym}-01`).toISOString();
    const res = await fetch("/api/logs", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, amount, cal_date, yyyymm: ym, note }),
    }).then(r => r.json() as Promise<{ ok: boolean; error?: string }>);
    if (!res.ok) alert(`エラー: ${res.error ?? "unknown"}`);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button onClick={() => setKind("expense")} className={`px-2 py-1 rounded ${kind==="expense"?"bg-white/10":"bg-white/5"}`}>支出</button>
        <button onClick={() => setKind("income")} className={`px-2 py-1 rounded ${kind==="income"?"bg-white/10":"bg-white/5"}`}>収入</button>
        <input type="month" value={ym} onChange={(e)=>setYm(e.target.value)} className="rounded bg-white/5 px-2 py-1" />
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="rounded bg-white/5 px-2 py-1" />
      </div>
      <div className="flex gap-2">
        <input type="number" value={amount} onChange={(e)=>setAmount(Number(e.target.value||0))} className="rounded bg-white/5 px-2 py-1 w-28" placeholder="金額" />
        <input value={note} onChange={(e)=>setNote(e.target.value)} className="rounded bg-white/5 px-2 py-1 flex-1" placeholder="メモ（任意）" />
        <button onClick={submit} className="rounded bg-white/10 px-3">記録する</button>
      </div>
    </div>
  );
}

