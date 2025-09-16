'use client';
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Budget = { id:number; month:string; category:string; amount:number };
const CATS = ['食費','交通','通信','住居','学業','医療','趣味','交際','その他'];

const ymNow = ()=> {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
};
const prevYm = (ym:string)=>{
  const [y,m] = ym.split('-').map(Number);
  const d = new Date(y, m-2, 1); // 前月
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
};
const fmt = (n:number)=>`${n.toLocaleString()}円`;

export default function BudgetsPage(){
  const [ym, setYm] = useState(ymNow());
  const [category, setCategory] = useState(CATS[0]);
  const [amount, setAmount] = useState<number>(0);
  const [list, setList] = useState<Budget[]>([]);
  const [busy, setBusy] = useState(false);
  const total = useMemo(()=> list.reduce((s,b)=>s+b.amount,0),[list]);

  const load = async () => {
    const { data } = await supabase.from('budgets')
      .select('id,month,category,amount')
      .eq('month', ym).order('category',{ascending:true});
    setList(data ?? []);
  };
  useEffect(()=>{ load(); },[ym]);

  const save = async ()=>{
    if (!amount || amount<0) return;
    setBusy(true);
    await supabase.from('budgets')
      .upsert([{ month: ym, category, amount }], { onConflict: 'month,category' });
    setAmount(0);
    await load();
    setBusy(false);
  };

  const remove = async (id:number)=>{
    setBusy(true);
    await supabase.from('budgets').delete().eq('id', id);
    setList(prev=>prev.filter(b=>b.id!==id));
    setBusy(false);
  };

  // 先月コピー（存在するものは上書き、無いものは作成）
  const copyFromPrev = async ()=>{
    setBusy(true);
    const srcYm = prevYm(ym);
    const { data: prev } = await supabase.from('budgets')
      .select('category,amount').eq('month', srcYm);

    if (!prev || prev.length===0) { setBusy(false); return; }

    const rows = prev.map(p=>({ month: ym, category: p.category, amount: p.amount }));
    await supabase.from('budgets').upsert(rows, { onConflict: 'month,category' });
    await load();
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">予算</h2>

      {/* フォーム */}
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input className="input w-36" value={ym} onChange={e=>setYm(e.target.value)} placeholder="YYYY-MM" />
          <select className="select w-28" value={category} onChange={e=>setCategory(e.target.value)}>
            {CATS.map(c=><option key={c}>{c}</option>)}
          </select>
          <input type="number" className="input w-28" min={0} placeholder="金額"
                 value={Number.isFinite(amount)?amount:''}
                 onChange={e=>setAmount(Number(e.target.value)||0)} />
          <button className="btn" onClick={save} disabled={busy}>保存</button>
          <button className="btn" onClick={copyFromPrev} disabled={busy}>先月からコピー</button>
        </div>
        <div className="text-sm text-muted">合計：<span className="font-semibold text-ink">{fmt(total)}</span></div>
      </div>

      {/* 一覧 */}
      <div className="space-y-2">
        {list.length===0 && (
          <div className="text-sm text-muted">まだ予算がありません。カテゴリと金額を入力して「保存」してください。</div>
        )}
        <ul className="space-y-2">
          {list.map(b=>(
            <li key={b.id} className="card flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{b.month}</span> / {b.category} / {fmt(b.amount)}
              </div>
              <button className="btn text-danger border-danger/40" onClick={()=>remove(b.id)} disabled={busy}>削除</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-xs text-muted">
        ヒント：同じ月に同じカテゴリをもう一度保存すると上書きされます。先月コピーでスピード入力も可。
      </div>
    </div>
  );
}

