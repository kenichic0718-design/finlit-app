// app/log/LogList.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type LogItem = {
  id: number;
  date: string; // 'YYYY-MM-DD'
  amount: number;
  memo: string | null;
  is_income: boolean;
};

type ApiList = { ok: true; items: LogItem[] } | { ok: false; error: string };

export default function LogList() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/logs?limit=200', { cache: 'no-store' });
      const json: ApiList = await res.json();
      if (!res.ok || !json || !('ok' in json) || !json.ok) {
        throw new Error((json as any)?.error ?? res.statusText);
      }
      // 並びは日付降順→id降順で安定
      const sorted = [...json.items].sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return b.id - a.id;
      });
      setItems(sorted);
    } catch (e: any) {
      setErr(e?.message ?? 'failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const refresh = fetchLogs;

  const onDelete = useCallback(
    async (id: number) => {
      if (!window.confirm('この記録を削除します。よろしいですか？')) return;
      try {
        const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? res.statusText);
        }
      } catch (e: any) {
        alert(`削除に失敗しました: ${e?.message ?? 'unknown error'}`);
      } finally {
        await refresh();
      }
    },
    [refresh]
  );

  const onEdit = useCallback(
    async (id: number, current: { amount: number; memo: string | null }) => {
      const a = window.prompt('金額を入力（半角数字）', String(current.amount ?? ''));
      if (a == null) return;
      const n = Number(a);
      if (!Number.isFinite(n)) {
        alert('数値を入力してください');
        return;
      }
      const m = window.prompt('メモ（空でもOK）', current.memo ?? '') ?? null;

      try {
        const res = await fetch(`/api/logs/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: n, memo: m }),
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? res.statusText);
        }
      } catch (e: any) {
        alert(`更新に失敗しました: ${e?.message ?? 'unknown error'}`);
      } finally {
        await refresh();
      }
    },
    [refresh]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, LogItem[]>();
    for (const it of items) {
      if (!map.has(it.date)) map.set(it.date, []);
      map.get(it.date)!.push(it);
    }
    // 日付降順で並べる
    return Array.from(map.entries()).sort(([d1], [d2]) => (d1 < d2 ? 1 : -1));
  }, [items]);

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">直近の記録</h2>

      {loading && <p>読み込み中…</p>}
      {err && (
        <p className="text-red-600">
          取得に失敗しました: {err}{' '}
          <button className="ml-2 underline" onClick={refresh}>
            再試行
          </button>
        </p>
      )}
      {!loading && !err && items.length === 0 && <p>まだ記録がありません。</p>}

      <ul className="space-y-4">
        {grouped.map(([date, logs]) => (
          <li key={date}>
            <div className="font-semibold mb-1">{date}</div>
            <ul className="ml-5 list-disc">
              {logs.map((log) => (
                <li key={log.id} className="mb-1">
                  <span className="mr-2">
                    {log.is_income ? '収入' : '支出'}：{log.amount} 円
                  </span>
                  {log.memo && <span className="text-gray-600 mr-2">({log.memo})</span>}
                  <button
                    className="px-2 py-0.5 text-sm border rounded mr-2"
                    onClick={() => onEdit(log.id, { amount: log.amount, memo: log.memo })}
                  >
                    編集
                  </button>
                  <button
                    className="px-2 py-0.5 text-sm border rounded"
                    onClick={() => onDelete(log.id)}
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <button className="px-3 py-1 border rounded" onClick={refresh}>
          再読込
        </button>
      </div>
    </div>
  );
}

