'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type LogItem = {
  id: number;
  date: string;
  amount: number;
  memo: string | null;
  is_income: boolean;
  category: string | null;
  category_id: number | null;
};

type GetResp = { ok: boolean; items?: LogItem[]; error?: string };

export default function LogList() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{ amount: string; memo: string }>({ amount: '', memo: '' });
  const [msg, setMsg] = useState<string>('');

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/logs?limit=20', { cache: 'no-store' });
      const j: GetResp = await r.json();
      if (j.ok && j.items) setItems(j.items);
      else setMsg(j.error ?? '読み込みに失敗しました');
    } catch {
      setMsg('読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const startEdit = (row: LogItem) => {
    setEditingId(row.id);
    setForm({ amount: String(row.amount), memo: row.memo ?? '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ amount: '', memo: '' });
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSave = async (id: number) => {
    setMsg('');
    const amountNum = Number(form.amount);
    if (!Number.isFinite(amountNum)) {
      setMsg('金額は数値で入力してください');
      return;
    }
    try {
      const r = await fetch(`/api/logs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountNum, memo: form.memo }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || '更新に失敗しました');
      cancelEdit();
      await fetchList();
      setMsg('更新しました！');
    } catch (e: any) {
      setMsg(e.message || '更新に失敗しました');
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm('この記録を削除しますか？')) return;
    setMsg('');
    try {
      const r = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || '削除に失敗しました');
      await fetchList();
      setMsg('削除しました！');
    } catch (e: any) {
      setMsg(e.message || '削除に失敗しました');
    }
  };

  const rows = useMemo(() => items, [items]);

  return (
    <div className="mt-10 space-y-3">
      <h2 className="text-lg font-semibold">直近の記録</h2>
      {loading && <p>読み込み中…</p>}
      {msg && <p className="text-sm opacity-80">{msg}</p>}
      {rows.length === 0 && !loading && <p>まだ記録がありません。</p>}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="border rounded p-3">
            {editingId === row.id ? (
              <div className="space-y-2">
                <div className="text-sm opacity-80">日付: {row.date} / {row.is_income ? '収入' : '支出'}</div>
                <label className="block">
                  <span className="text-sm">金額</span>
                  <input
                    name="amount"
                    value={form.amount}
                    onChange={onChange}
                    className="border rounded px-2 py-1 w-32 ml-2"
                    inputMode="decimal"
                  />
                </label>
                <label className="block">
                  <span className="text-sm">メモ</span>
                  <input
                    name="memo"
                    value={form.memo}
                    onChange={onChange}
                    className="border rounded px-2 py-1 ml-2 w-72"
                  />
                </label>
                <div className="space-x-2">
                  <button onClick={() => onSave(row.id)} className="border rounded px-3 py-1">保存</button>
                  <button onClick={cancelEdit} className="border rounded px-3 py-1">キャンセル</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{row.is_income ? '収入' : '支出'} / {row.amount} 円</div>
                  <div className="text-sm opacity-80">
                    {row.date} / カテゴリ: {row.category ?? '（なし）'} {row.memo ? ` / メモ: ${row.memo}` : ''}
                  </div>
                </div>
                <div className="space-x-2">
                  <button onClick={() => startEdit(row)} className="border rounded px-3 py-1">編集</button>
                  <button onClick={() => onDelete(row.id)} className="border rounded px-3 py-1">削除</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
