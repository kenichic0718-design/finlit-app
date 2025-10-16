// app/log/LogList.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LogItem = {
  id: number;
  profile_id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  memo: string | null;
  is_income: boolean;
};

type ApiList = { ok: true; items: LogItem[] } | { ok: false; error: string };
type ApiResult<T> = { ok: true; item: T } | { ok: false; error: string };

export default function LogList() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 編集フォームの局所状態
  const [editDate, setEditDate] = useState("");
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMemo, setEditMemo] = useState("");
  const [editIncome, setEditIncome] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, LogItem[]>();
    for (const it of items) {
      const k = it.date;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    // 日付降順
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, rows]) => [date, rows.sort((x, y) => x.id - y.id)] as const);
  }, [items]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/logs?limit=200", { cache: "no-store" });
      const json: ApiList = await res.json();
      if (!json.ok) throw new Error(json.error);
      setItems(json.items);
    } catch (e: any) {
      alert(`カテゴリの取得に失敗しました: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onClickEdit = (it: LogItem) => {
    setEditingId(it.id);
    setEditDate(it.date);
    setEditAmount(it.amount);
    setEditMemo(it.memo ?? "");
    setEditIncome(!!it.is_income);
  };

  const onCancelEdit = () => {
    setEditingId(null);
  };

  const onDelete = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    try {
      const res = await fetch(`/api/logs/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Delete failed");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      alert(`削除に失敗しました: ${e?.message ?? e}`);
    }
  };

  const onSave = async (id: number) => {
    try {
      const payload = {
        date: editDate,
        amount: Number(editAmount),
        memo: editMemo || null,
        is_income: !!editIncome,
      };

      const res = await fetch(`/api/logs/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      // ここはサーバーが必ず JSON を返す前提に修正済み
      const json: ApiResult<LogItem> = await res.json();

      if (!json.ok) throw new Error(json.error ?? "Update failed");

      setItems((prev) => prev.map((x) => (x.id === id ? json.item : x)));
      setEditingId(null);
    } catch (e: any) {
      alert(`更新に失敗しました: ${e?.message ?? e}`);
    }
  };

  if (loading) return <div>読み込み中…</div>;

  return (
    <div>
      <h1>記録</h1>

      <h2>直近の記録</h2>

      <button onClick={fetchList} style={{ marginBottom: 12 }}>
        再読み込み
      </button>

      <ul>
        {grouped.map(([date, rows]) => (
          <li key={date} style={{ marginBottom: 16 }}>
            <strong>{date}</strong>
            <ul>
              {rows.map((it) => {
                const isEditing = editingId === it.id;
                return (
                  <li key={it.id} style={{ margin: "6px 0" }}>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div>日付：</div>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                        />
                        <div>金額：</div>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(Number(e.target.value))}
                          style={{ width: 90 }}
                        />
                        <div>メモ：</div>
                        <input
                          type="text"
                          value={editMemo}
                          onChange={(e) => setEditMemo(e.target.value)}
                          style={{ width: 220 }}
                        />
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          収入？
                          <input
                            type="checkbox"
                            checked={editIncome}
                            onChange={(e) => setEditIncome(e.target.checked)}
                          />
                        </label>
                        <button onClick={() => onSave(it.id)}>保存</button>
                        <button onClick={onCancelEdit}>キャンセル</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span>
                          ・{it.is_income ? "収入" : "支出"}：{it.amount} 円
                          {it.memo ? `（${it.memo}）` : ""}
                        </span>
                        <button onClick={() => onClickEdit(it)}>編集</button>
                        <button onClick={() => onDelete(it.id)}>削除</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

