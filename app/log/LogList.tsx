// app/log/LogList.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type LogItem = {
  id: number;
  date: string; // YYYY-MM-DD
  amount: number;
  memo: string | null;
  is_income: boolean;
};

type Group = { ymd: string; items: LogItem[] };

export default function LogList() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs?limit=100', {
        cache: 'no-store',
        credentials: 'include', // ← Cookie を必ず送る
      });
      const json = await res.json();
      if (json?.ok) setItems(json.items ?? []);
      else console.warn('load logs failed:', json?.error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 初回ロード
    load();
  }, [load]);

  const onDelete = useCallback(async (id: number) => {
    if (!confirm('この記録を削除しますか？')) return;

    // 楽観更新：先に画面から消す
    const prev = items;
    setItems((cur) => cur.filter((x) => x.id !== id));

    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: 'DELETE',
        credentials: 'include', // ← これが重要
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`削除に失敗しました: ${j?.error ?? res.statusText}`);
        // 戻す
        setItems(prev);
        return;
      }

      // 念のためサーバー再取得で確定させる
      await load();
    } catch (e: any) {
      alert(`削除に失敗しました: ${e?.message ?? e}`);
      setItems(prev);
    }
  }, [items, load]);

  const grouped = useMemo<Group[]>(() => {
    const map = new Map<string, LogItem[]>();
    for (const it of items) {
      const ymd = it.date;
      if (!map.has(ymd)) map.set(ymd, []);
      map.get(ymd)!.push(it);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([ymd, arr]) => ({
        ymd,
        items: arr.sort((a, b) => b.id - a.id),
      }));
  }, [items]);

  if (loading) return <p>読み込み中…</p>;
  if (!items.length) return <p>まだ記録がありません。</p>;

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">直近の記録</h2>
      <ul className="space-y-4">
        {grouped.map((g) => (
          <li key={g.ymd}>
            <div className="font-semibold">• {g.ymd}</div>
            <ul className="ml-6 list-disc">
              {g.items.map((it) => (
                <li key={it.id} className="my-1">
                  {it.is_income ? '収入' : '支出'}：{it.amount} 円
                  {it.memo ? `（${it.memo}）` : ''}{' '}
                  <button
                    className="mx-1 rounded border px-2 py-0.5"
                    onClick={() => alert('編集は次のステップで復旧します')}
                  >
                    編集
                  </button>
                  <button
                    className="mx-1 rounded border px-2 py-0.5"
                    onClick={() => onDelete(it.id)}
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

