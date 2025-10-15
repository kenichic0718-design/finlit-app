// app/log/LogList.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type LogItem = {
  id: number;
  date: string;       // YYYY-MM-DD
  amount: number;     // 円
  memo: string | null;
  is_income: boolean; // 収入なら true
};

type ApiList = { ok: true; items: LogItem[] } | { ok: false; error: string };

export default function LogList() {
  const [items, setItems] = useState<LogItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs?limit=50', { cache: 'no-store' });
      const json: ApiList = await res.json();
      if ('ok' in json && json.ok) setItems(json.items);
      else setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const g = new Map<string, LogItem[]>();
    (items ?? []).forEach(it => {
      const list = g.get(it.date) ?? [];
      list.push(it);
      g.set(it.date, list);
    });
    // 日付降順、同日は id 降順
    return Array.from(g.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, rows]) => ({
        date,
        rows: rows.sort((x, y) => y.id - x.id),
      }));
  }, [items]);

  const doDelete = useCallback(async (id: number) => {
    if (!confirm('この記録を削除しますか？')) return;
    // 楽観更新
    setItems(prev => (prev ?? []).filter(it => it.id !== id));

    const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      // 失敗したら復元 → 再取得
      await load();
      const j = await res.json().catch(() => ({}));
      alert(`削除に失敗しました: ${j?.error ?? res.statusText}`);
      return;
    }
    // 念のため最新を再取得（他端末での変更等を吸収）
    await load();
  }, [load]);

  const doEdit = useCallback(async (id: number) => {
    const amountStr = prompt('金額（円）を入力してください:');
    if (amountStr == null) return;
    const amount = Number(amountStr);
    if (!Number.isFinite(amount)) {
      alert('数値で入力してください');
      return;
    }
    const memo = prompt('メモ（空でもOK）') ?? null;

    // 楽観更新
    setItems(prev => (prev ?? []).map(it => it.id === id ? { ...it, amount, memo } : it));

    const res = await fetch(`/api/logs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, memo }),
    });
    if (!res.ok) {
      await load();
      const j = await res.json().catch(() => ({}));
      alert(`更新に失敗しました: ${j?.error ?? res.statusText}`);
      return;
    }
    await load();
  }, [load]);

  if (loading && items === null) return <p>読み込み中…</p>;
  if ((items?.length ?? 0) === 0) return <p>まだ記録がありません。</p>;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">直近の記録</h2>
      <ul className="space-y-4">
        {grouped.map(({ date, rows }) => (
          <li key={date}>
            <div className="font-bold">{date}</div>
            <ul className="ml-6 list-disc">
              {rows.map(it => (
                <li key={it.id} className="my-1">
                  {it.is_income ? '収入' : '支出'}：{it.amount} 円
                  {it.memo ? `（${it.memo}）` : ''}{' '}
                  <button onClick={() => doEdit(it.id)} className="mx-1 px-1 border rounded">編集</button>
                  <button onClick={() => doDelete(it.id)} className="mx-1 px-1 border rounded">削除</button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

