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
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      // エッジキャッシュを避けるためにタイムスタンプを付与
      const res = await fetch(`/api/logs?limit=20&t=${Date.now()}`, {
        // ブラウザの Cookie を使うため include
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'failed');
      setItems(json.items as LogItem[]);
    } catch (e) {
      console.error(e);
      alert('記録の取得に失敗しました。');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm('この記録を削除しますか？')) return;

    // 楽観的更新：先に画面から消す（失敗時は戻す）
    const prev = items ?? [];
    setItems(prev.filter((x) => x.id !== id));

    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || 'delete failed');
      }
      // 念のため再取得（不整合を避ける）
      await load();
    } catch (e) {
      console.error(e);
      alert('削除に失敗しました。再読み込みしてもう一度お試しください。');
      // ロールバック
      setItems(prev);
    }
  }

  return (
    <section>
      <h2 className="text-lg font-bold mb-3">直近の記録</h2>
      {loading && <p>読み込み中...</p>}
      {!loading && (!items || items.length === 0) && <p>まだ記録がありません。</p>}
      <ul className="space-y-2">
        {items?.map((it) => (
          <li key={it.id}>
            {it.date} {it.is_income ? '収入' : '支出'}：{it.amount} 円
            {it.memo ? `（${it.memo}）` : ''}{' '}
            <button
              className="px-2 py-0.5 text-sm border rounded mr-1"
              onClick={() => alert('編集は後で復活させます！')}
            >
              編集
            </button>
            <button
              className="px-2 py-0.5 text-sm border rounded"
              onClick={() => handleDelete(it.id)}
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

