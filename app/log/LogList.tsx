'use client';

import { useEffect, useMemo, useState } from 'react';

type LogItem = {
  id: number;
  date: string;            // 'YYYY-MM-DD'
  amount: number;          // 金額（整数想定）
  memo?: string | null;    // 任意メモ
  is_income: boolean;      // 収入なら true
};

type LogsResponse =
  | { ok: true; items: LogItem[] }
  | { ok: false; error: string };

export default function LogList() {
  const [items, setItems] = useState<LogItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function load(limit = 20) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/logs?limit=${limit}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const json: LogsResponse = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error((json as any)?.error || `fetch failed: ${res.status}`);
      }
      setItems(json.items);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? '読み込みに失敗しました。');
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

    const prev = items ?? [];
    setItems(prev.filter((x) => x.id !== id)); // 楽観的に先に消しておく

    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const text = await res.text();
      console.log('DELETE /api/logs/:id status=', res.status, 'body=', text);

      let json: any = {};
      try { json = JSON.parse(text); } catch (_) {}
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || `delete failed (status ${res.status})`);
      }

      // 成功時はサーバー値で確定
      await load();
    } catch (e) {
      console.error(e);
      alert('削除に失敗しました。' + (e as Error).message);
      setItems(prev); // ロールバック
    }
  }

  async function handleEdit(item: LogItem) {
    const newAmountStr = prompt('金額（整数）を入力してください', String(item.amount));
    if (newAmountStr == null) return;
    const newAmount = Number(newAmountStr);
    if (!Number.isFinite(newAmount)) {
      alert('数値を入力してください'); return;
    }
    const newMemo = prompt('メモ（空でもOK）', item.memo ?? '') ?? '';

    // 楽観更新
    const prev = items ?? [];
    setItems(prev.map((x) => x.id === item.id ? { ...x, amount: newAmount, memo: newMemo } : x));

    try {
      const res = await fetch(`/api/logs/${item.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: newAmount, memo: newMemo }),
      });
      const text = await res.text();
      console.log('PUT /api/logs/:id status=', res.status, 'body=', text);

      let json: any = {};
      try { json = JSON.parse(text); } catch (_) {}
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || `update failed (status ${res.status})`);
      }
      await load();
    } catch (e) {
      console.error(e);
      alert('更新に失敗しました。' + (e as Error).message);
      setItems(prev); // ロールバック
    }
  }

  const grouped = useMemo(() => {
    const g = new Map<string, LogItem[]>();
    (items ?? []).forEach((it) => {
      const arr = g.get(it.date) ?? [];
      arr.push(it);
      g.set(it.date, arr);
    });
    // 日付降順
    return Array.from(g.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

  return (
    <section>
      <h2 className="text-lg font-bold mb-3">直近の記録</h2>

      {loading && <p>読み込み中…</p>}
      {error && <p className="text-red-600">エラー: {error}</p>}
      {!loading && (items?.length ?? 0) === 0 && <p>まだ記録がありません。</p>}

      <ul className="space-y-3">
        {grouped.map(([date, rows]) => (
          <li key={date}>
            <div className="font-semibold mb-1">• {date}</div>
            <ul className="ml-6 space-y-1">
              {rows.map((r) => (
                <li key={r.id}>
                  <span className="mr-2">
                    {r.is_income ? '収入' : '支出'}：{r.amount} 円
                    {r.memo ? `（${r.memo}）` : ''}
                  </span>
                  <button
                    className="px-2 py-0.5 text-sm border rounded mr-1"
                    onClick={() => handleEdit(r)}
                  >
                    編集
                  </button>
                  <button
                    className="px-2 py-0.5 text-sm border rounded"
                    onClick={() => handleDelete(r.id)}
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

