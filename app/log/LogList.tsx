// app/log/LogList.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type LogItem = {
  id: number;
  profile_id: string;
  date: string;            // YYYY-MM-DD
  amount: number;
  memo: string | null;
  is_income: boolean;
};

type ApiList = { ok: true; items: LogItem[] } | { ok: false; error: string };
type ApiOne =
  | { ok: true; item?: LogItem; deleted?: number }
  | { ok: false; error: string };

export default function LogList() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 編集中の行IDとフォーム値
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMemo, setEditMemo] = useState<string>('');
  const [editIncome, setEditIncome] = useState<boolean>(false);

  // 初回＆手動リロード
  async function fetchLogs() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/logs?limit=200', { credentials: 'include' });
      const json: ApiList = await res.json();
      if (!json.ok) throw new Error(json.error || 'failed');
      setItems(normalizeAndSort(json.items));
    } catch (e: any) {
      setErr(e?.message ?? '取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  // 表示用：日付降順→同日内はid降順
  function normalizeAndSort(list: LogItem[]) {
    return [...list].sort((a, b) => {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return b.id - a.id;
    });
  }

  // 日付ごとにグループ化
  const grouped = useMemo(() => {
    const map = new Map<string, LogItem[]>();
    for (const it of items) {
      const arr = map.get(it.date) ?? [];
      arr.push(it);
      map.set(it.date, arr);
    }
    // 並びも担保
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

  // 編集開始
  function startEdit(it: LogItem) {
    setEditingId(it.id);
    setEditDate(it.date);
    setEditAmount(it.amount);
    setEditMemo(it.memo ?? '');
    setEditIncome(it.is_income);
  }

  // 編集キャンセル
  function cancelEdit() {
    setEditingId(null);
  }

  // 保存（PATCH）
  async function saveEdit(id: number) {
    // 楽観更新：先に画面を書き換え、失敗したら戻す
    const before = items;
    const next = before.map((x) =>
      x.id === id
        ? {
            ...x,
            date: editDate,
            amount: editAmount,
            memo: editMemo || null,
            is_income: editIncome,
          }
        : x
    );
    setItems(normalizeAndSort(next));

    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date: editDate,
          amount: editAmount,
          memo: editMemo || null,
          is_income: editIncome,
        }),
      });
      const json: ApiOne = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error((json as any)?.error || '更新に失敗しました');
      }
      // サーバ値を優先反映（並びも整える）
      if (json.item) {
        setItems((cur) => normalizeAndSort(cur.map((x) => (x.id === id ? json.item! : x))));
      }
      setEditingId(null);
    } catch (e: any) {
      alert(`更新に失敗しました: ${e?.message ?? 'unknown error'}`);
      setItems(before); // ロールバック
    }
  }

  // 削除（DELETE）
  async function deleteRow(it: LogItem) {
    if (!confirm('本当に削除しますか？')) return;

    const before = items;
    setItems(before.filter((x) => x.id !== it.id));

    try {
      const res = await fetch(`/api/logs/${it.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json: ApiOne = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error((json as any)?.error || '削除に失敗しました');
      }
    } catch (e: any) {
      alert(`削除に失敗しました: ${e?.message ?? 'unknown error'}`);
      setItems(before); // ロールバック
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>記録</h1>

      {loading && <p>読み込み中...</p>}
      {err && (
        <p style={{ color: 'crimson' }}>
          エラー: {err}{' '}
          <button onClick={fetchLogs} style={{ marginLeft: 8 }}>
            再読み込み
          </button>
        </p>
      )}

      {!loading && !err && (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>直近の記録</h2>

          {grouped.length === 0 && <p style={{ opacity: 0.7 }}>まだ記録がありません。</p>}

          <ul>
            {grouped.map(([date, list]) => (
              <li key={date} style={{ marginTop: 14 }}>
                <strong>・{date}</strong>
                <ul>
                  {list.map((it) => {
                    const editing = editingId === it.id;
                    if (editing) {
                      return (
                        <li key={it.id} style={{ marginTop: 6 }}>
                          <span>・</span>
                          <label style={{ marginRight: 8 }}>
                            日付：{' '}
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              style={{ width: 130 }}
                            />
                          </label>
                          <label style={{ marginRight: 8 }}>
                            金額：{' '}
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(Number(e.target.value))}
                              style={{ width: 90 }}
                            />
                          </label>
                          <label style={{ marginRight: 8 }}>
                            メモ：{' '}
                            <input
                              type="text"
                              value={editMemo}
                              onChange={(e) => setEditMemo(e.target.value)}
                              style={{ width: 220 }}
                            />
                          </label>
                          <label style={{ marginRight: 8 }}>
                            収入？{' '}
                            <input
                              type="checkbox"
                              checked={editIncome}
                              onChange={(e) => setEditIncome(e.target.checked)}
                            />
                          </label>
                          <button onClick={() => saveEdit(it.id)} style={{ marginRight: 6 }}>
                            保存
                          </button>
                          <button onClick={cancelEdit}>キャンセル</button>
                        </li>
                      );
                    }

                    return (
                      <li key={it.id} style={{ marginTop: 6 }}>
                        <span>・</span>
                        <span style={{ marginRight: 8 }}>
                          {it.is_income ? '収入' : '支出'}：{it.amount} 円
                          {it.memo ? `（${it.memo}）` : ''}
                        </span>
                        <button onClick={() => startEdit(it)} style={{ marginRight: 6 }}>
                          編集
                        </button>
                        <button onClick={() => deleteRow(it)}>削除</button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>

          <button onClick={fetchLogs} style={{ marginTop: 10 }}>再読み込み</button>
        </>
      )}
    </div>
  );
}

