'use client';

import { useEffect, useState } from 'react';

type LogItem = {
  id: number;
  date: string;
  amount: number;
  memo: string | null;
  is_income: boolean;
};

export default function LogList() {
  const [items, setItems] = useState<LogItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch('/api/logs?limit=50', { cache: 'no-store' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'failed to load');
      setItems(json.items as LogItem[]);
    } catch (e: any) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: number) {
    if (!confirm('この記録を削除しますか？')) return;
    const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.ok) {
      alert('削除に失敗しました: ' + (json.error ?? 'unknown'));
      return;
    }
    await load();
  }

  async function onEdit(id: number, current: LogItem) {
    const amountStr = prompt('金額を入力してください', String(current.amount));
    if (amountStr == null) return;
    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount < 0) {
      alert('金額が不正です');
      return;
    }
    const memo = prompt('メモ（空でもOK）', current.memo ?? '') ?? current.memo ?? '';

    const res = await fetch(`/api/logs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, memo }),
    });
    const json = await res.json();
    if (!json.ok) {
      alert('更新に失敗しました: ' + (json.error ?? 'unknown'));
      return;
    }
    await load();
  }

  if (loading) return <p>読み込み中...</p>;
  if (err) return <p style={{ color: 'crimson' }}>エラー: {err}</p>;
  if (!items || items.length === 0) return <p>まだ記録がありません。</p>;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">直近の記録</h2>
      <ul className="space-y-2">
        {items.map((x) => (
          <li key={x.id} className="flex items-center gap-3">
            <span className="shrink-0 w-28 text-gray-600">{x.date}</span>
            <span className="shrink-0">{x.is_income ? '収入' : '支出'}：</span>
            <span className="shrink-0">{x.amount} 円</span>
            {x.memo ? <span className="text-gray-500">（{x.memo}）</span> : null}
            <button className="ml-2 px-2 py-0.5 border rounded" onClick={() => onEdit(x.id, x)}>
              編集
            </button>
            <button className="px-2 py-0.5 border rounded" onClick={() => onDelete(x.id)}>
              削除
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

