// app/log/LogList.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

// API から返るレコード型（必要最小限）
type LogItem = {
  id: number;
  profile_id: string;
  date: string; // 'YYYY-MM-DD'
  amount: number;
  memo: string | null;
  is_income: boolean;
  category_id?: string | null;
};

type ApiList = { ok: true; items: LogItem[] } | { ok: false; error: string };
type ApiOne =
  | { ok: true; item: LogItem }
  | { ok: true; deleted: number }
  | { ok: false; error: string };

function yen(n: number) {
  return `${n.toLocaleString('ja-JP')} 円`;
}

// 日付降順グルーピング
function groupByDate(items: LogItem[]) {
  const map = new Map<string, LogItem[]>();
  for (const it of items) {
    if (!map.has(it.date)) map.set(it.date, []);
    map.get(it.date)!.push(it);
  }
  const dates = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));
  return dates.map((d) => ({ date: d, rows: map.get(d)!.sort((a, b) => a.id - b.id) }));
}

export default function LogList() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LogItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 編集状態
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<string>(''); // 入力は文字列で保持
  const [editMemo, setEditMemo] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editIsIncome, setEditIsIncome] = useState<boolean>(false);

  // 一覧取得
  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/logs?limit=200', { cache: 'no-store' });
      const json: ApiList = await res.json();
      if (!json.ok) throw new Error(json.error);
      setItems(json.items);
    } catch (e: any) {
      setError(e?.message ?? '一覧の取得に失敗しました。');
      alert(`カテゴリの取得に失敗しました。\n${e?.message ?? ''}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  const grouped = useMemo(() => groupByDate(items), [items]);

  // 編集開始
  function startEdit(it: LogItem) {
    setEditingId(it.id);
    setEditAmount(String(it.amount ?? 0));
    setEditMemo(it.memo ?? '');
    setEditDate(it.date);
    setEditIsIncome(!!it.is_income);
  }

  // 編集キャンセル
  function cancelEdit() {
    setEditingId(null);
    setEditAmount('');
    setEditMemo('');
    setEditDate('');
    setEditIsIncome(false);
  }

  // 保存（PATCH）
  async function saveEdit(id: number) {
    const amount = Number(editAmount);
    if (Number.isNaN(amount)) {
      alert('金額は数値で入力してください。');
      return;
    }
    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount,
          memo: editMemo || null,
          date: editDate,
          is_income: editIsIncome,
        }),
      });
      const json: ApiOne = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error((json as any)?.error ?? `HTTP ${res.status}`);
      }

      if ('item' in json) {
        // ローカル反映（再取得でもOK）
        setItems((prev) => prev.map((x) => (x.id === id ? json.item : x)));
      } else {
        // 念のため（削除レスポンスでは来ない）
        await fetchList();
      }
      cancelEdit();
    } catch (e: any) {
      alert(`更新に失敗しました: ${e?.message ?? ''}`);
    }
  }

  // 削除
  async function remove(id: number) {
    if (!confirm('この記録を削除しますか？')) return;
    try {
      const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
      const json: ApiOne = await res.json();
      if (!res.ok || !json.ok) throw new Error((json as any)?.error ?? `HTTP ${res.status}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      alert(`削除に失敗しました: ${e?.message ?? ''}`);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>記録</h1>

      <section>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '16px 0' }}>直近の記録</h2>

        {loading && <p>読み込み中…</p>}
        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        {!loading && !error && grouped.length === 0 && <p>記録がありません。</p>}

        {!loading &&
          !error &&
          grouped.map(({ date, rows }) => (
            <div key={date} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>・{date}</div>
              <ul>
                {rows.map((it) => {
                  const isEdit = editingId === it.id;

                  if (isEdit) {
                    return (
                      <li key={it.id} style={{ margin: '6px 0' }}>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            saveEdit(it.id);
                          }}
                          style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                        >
                          <label>
                            日付：
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              style={{ marginLeft: 4 }}
                              required
                            />
                          </label>
                          <label>
                            金額：
                            <input
                              type="number"
                              inputMode="numeric"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              style={{ width: 100, marginLeft: 4 }}
                              required
                            />
                          </label>
                          <label>
                            メモ：
                            <input
                              type="text"
                              value={editMemo}
                              onChange={(e) => setEditMemo(e.target.value)}
                              style={{ width: 200, marginLeft: 4 }}
                            />
                          </label>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            収入？
                            <input
                              type="checkbox"
                              checked={editIsIncome}
                              onChange={(e) => setEditIsIncome(e.target.checked)}
                            />
                          </label>
                          <button type="submit">保存</button>
                          <button type="button" onClick={cancelEdit}>
                            キャンセル
                          </button>
                        </form>
                      </li>
                    );
                  }

                  return (
                    <li key={it.id} style={{ margin: '6px 0' }}>
                      <span>
                        ・{it.is_income ? '収入' : '支出'}：{yen(it.amount)}
                        {it.memo ? `（${it.memo}）` : ''}
                      </span>
                      <button style={{ marginLeft: 8 }} onClick={() => startEdit(it)}>
                        編集
                      </button>
                      <button style={{ marginLeft: 4 }} onClick={() => remove(it.id)}>
                        削除
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

        <button onClick={fetchList}>再読み込み</button>
      </section>
    </div>
  );
}

