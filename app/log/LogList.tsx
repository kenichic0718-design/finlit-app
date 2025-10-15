// app/log/LogList.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Log = {
  id: number;
  date: string;          // 'YYYY-MM-DD'
  amount: number;
  memo: string | null;
  is_income: boolean;
};

type ApiList = { ok: true; items: Log[] } | { ok: false; error: string };
type ApiDelete = { ok: true; deleted: number } | { ok: false; error: string };
type ApiPatch  = { ok: true; item?: Log } | { ok: false; error: string };

export default function LogList() {
  const [items, setItems] = useState<Log[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    const res = await fetch('/api/logs?limit=200', { cache: 'no-store' });
    const json = (await res.json()) as ApiList;
    if (!json.ok) {
      alert(`カテゴリの取得に失敗しました。`);
      setItems([]);
      return;
    }
    setItems(json.items);
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    if (!items) return [];
    const map = new Map<string, Log[]>();
    for (const it of items) {
      (map.get(it.date) ?? map.set(it.date, []).get(it.date)!)?.push(it);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

  async function onDelete(id: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiDelete;
      if (!json.ok) {
        alert(`削除に失敗しました: ${'error' in json ? json.error : 'Unknown'}`);
        return;
      }
      setItems((prev) => prev ? prev.filter((x) => x.id !== id) : prev);
    } finally {
      setBusyId(null);
    }
  }

  async function onEdit(id: number) {
    const current = items?.find((x) => x.id === id);
    if (!current) return;

    const amountStr = prompt('金額（整数）', String(current.amount));
    if (amountStr == null) return;

    const amount = Number(amountStr);
    if (!Number.isFinite(amount)) {
      alert('金額は数値で入力してください');
      return;
    }

    setBusyId(id);
    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const json = (await res.json()) as ApiPatch;
      if (!json.ok) {
        alert(`更新に失敗しました: ${'error' in json ? json.error : 'Unknown'}`);
        return;
      }
      // 返ってきた行でローカル更新（なければ金額だけ反映）
      setItems((prev) =>
        prev
          ? prev.map((x) =>
              x.id === id
                ? json.item
                  ? { ...x, ...json.item }
                  : { ...x, amount }
                : x,
            )
          : prev,
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1>記録</h1>
      <h2>直近の記録</h2>

      {!items && <p>読み込み中...</p>}
      {items && items.length === 0 && <p>データがありません。</p>}

      {grouped.map(([date, logs]) => (
        <div key={date} style={{ marginBottom: 12 }}>
          <strong>・{date}</strong>
          <ul style={{ marginLeft: 16 }}>
            {logs.map((l) => (
              <li key={l.id} style={{ margin: '4px 0' }}>
                ◦ {l.is_income ? '収入' : '支出'}：{l.amount} 円 {l.memo ? `(${l.memo})` : ''}
                &nbsp;
                <button disabled={busyId === l.id} onClick={() => onEdit(l.id)}>編集</button>
                &nbsp;
                <button disabled={busyId === l.id} onClick={() => onDelete(l.id)}>削除</button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <button onClick={load}>再読込</button>
    </div>
  );
}

