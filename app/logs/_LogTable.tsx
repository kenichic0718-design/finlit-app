// app/logs/_LogTable.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Props = {
  month: string; // 'YYYY-MM'
  kind: 'expense' | 'income';
};

type Row = {
  id: string;
  happened_on: string;
  kind: 'expense' | 'income';
  amount: number;
  memo: string | null;
  category?: { id: string; name: string | null; position: number | null } | null;
};

export default function LogTable({ month, kind }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(
    () => rows.filter((r) => r.kind === kind),
    [rows, kind]
  );

  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/logs?month=${month}`);
        // 未ログイン時でも 200/空配列が返る実装なので例外にしない
        const json = await res.json();
        if (!aborted) {
          setRows(Array.isArray(json.items) ? json.items : []);
        }
      } catch {
        if (!aborted) setRows([]);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [month]);

  async function onDelete(id: string) {
    if (!confirm('この記録を削除しますか？')) return;
    const res = await fetch(`/api/logs?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      alert(`削除に失敗しました: ${await res.text()}`);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) return <p>読み込み中…</p>;
  if (filtered.length === 0) return <p>この月の記録はまだありません。</p>;

  return (
    <div className="rounded border p-3 max-w-3xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1 px-1 w-28">日付</th>
            <th className="text-left py-1 px-1 w-56">カテゴリ</th>
            <th className="text-right py-1 px-1 w-28">金額</th>
            <th className="text-left py-1 px-1">メモ</th>
            <th className="w-16" />
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-b last:border-none">
              <td className="py-1 px-1">{r.happened_on}</td>
              <td className="py-1 px-1">{r.category?.name ?? '(削除済み?)'}</td>
              <td className="py-1 px-1 text-right">{r.amount.toLocaleString()}</td>
              <td className="py-1 px-1">{r.memo ?? ''}</td>
              <td className="py-1 px-1">
                <button
                  className="border rounded px-2 py-0.5"
                  onClick={() => onDelete(r.id)}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

