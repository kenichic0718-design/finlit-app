// app/log/LogList.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type LogRow = {
  id: number;
  profile_id: string;
  date: string; // "YYYY-MM-DD"
  amount: number;
  memo: string | null;
  is_income: boolean;
};

type Groups = Map<string, LogRow[]>;

function ymd(date: string) {
  // 既に YYYY-MM-DD 形式で来る想定だが保険
  return date.length >= 10 ? date.slice(0, 10) : date;
}

export default function LogList() {
  const [groups, setGroups] = useState<Groups>(new Map());
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMemo, setEditMemo] = useState<string>("");
  const [editIncome, setEditIncome] = useState<boolean>(false);

  const flat = useMemo(
    () => Array.from(groups.values()).flatMap((arr) => arr),
    [groups]
  );

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs?limit=200", { cache: "no-store" });
      const raw = await res.text(); // 空ボディ保険
      if (!raw) throw new Error("Empty response");
      const data = JSON.parse(raw);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "fetch failed");

      const items: LogRow[] = data.items ?? [];
      // 日付降順→id降順ぐらいで軽く並べる
      items.sort((a, b) => {
        const d = ymd(b.date).localeCompare(ymd(a.date));
        if (d) return d;
        return b.id - a.id;
      });

      const g = new Map<string, LogRow[]>();
      for (const row of items) {
        const key = ymd(row.date);
        if (!g.has(key)) g.set(key, []);
        g.get(key)!.push(row);
      }
      setGroups(g);
    } catch (e) {
      console.error(e);
      alert("カテゴリの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function beginEdit(row: LogRow) {
    setEditingId(row.id);
    setEditDate(ymd(row.date));
    setEditAmount(row.is_income ? -row.amount : row.amount); // 画面は支出+／収入- ではなく単純額で扱うなら調整不要。ここは元UI踏襲せず正値に。
    setEditMemo(row.memo ?? "");
    setEditIncome(row.is_income);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: number) {
    const payload: Partial<LogRow> & { date?: string } = {
      amount: Number(editAmount),
      memo: editMemo ?? "",
      is_income: !!editIncome,
      date: editDate,
    };
    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 空ボディでも落ちないように
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || res.statusText);
      }

      // 返ってきた最新行で UI を差し替え
      const updated: LogRow = data.item;
      setGroups((prev) => {
        const copy = new Map(prev);

        // 1) 既存グループから古い行を除去
        for (const [k, arr] of copy.entries()) {
          const idx = arr.findIndex((r) => r.id === id);
          if (idx >= 0) {
            const newArr = [...arr];
            newArr.splice(idx, 1);
            copy.set(k, newArr);
            if (newArr.length === 0) copy.delete(k);
            break;
          }
        }

        // 2) 新しい日付のグループに挿入
        const key = ymd(updated.date);
        const arr = copy.get(key) ?? [];
        // 日付グループ内は id 降順の軽い規則
        const newArr = [...arr, updated].sort((a, b) => b.id - a.id);
        copy.set(key, newArr);
        return copy;
      });

      setEditingId(null);
      alert("更新しました。");
    } catch (e: any) {
      console.error(e);
      alert(`更新に失敗しました: ${e.message || e}`);
    }
  }

  async function remove(id: number) {
    if (!confirm("削除しますか？")) return;
    try {
      const res = await fetch(`/api/logs/${id}`, { method: "DELETE" });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || res.statusText);
      }
      setGroups((prev) => {
        const copy = new Map(prev);
        for (const [k, arr] of copy.entries()) {
          const idx = arr.findIndex((r) => r.id === id);
          if (idx >= 0) {
            const newArr = [...arr];
            newArr.splice(idx, 1);
            copy.set(k, newArr);
            if (!newArr.length) copy.delete(k);
            break;
          }
        }
        return copy;
      });
    } catch (e: any) {
      console.error(e);
      alert(`削除に失敗しました: ${e.message || e}`);
    }
  }

  const dayKeysDesc = useMemo(
    () => Array.from(groups.keys()).sort((a, b) => b.localeCompare(a)),
    [groups]
  );

  return (
    <div>
      <h1>記録</h1>

      <h2>直近の記録</h2>

      {loading && <p>読み込み中…</p>}

      {!loading && dayKeysDesc.length === 0 && <p>記録がありません。</p>}

      <ul>
        {dayKeysDesc.map((day) => (
          <li key={day} style={{ marginBottom: 16 }}>
            <strong>・{day}</strong>
            <ul>
              {groups.get(day)!.map((row) => {
                const editing = editingId === row.id;
                if (!editing) {
                  return (
                    <li key={row.id} style={{ marginTop: 6 }}>
                      ・ {row.is_income ? "収入" : "支出"}：{row.amount} 円{" "}
                      {row.memo ? `(${row.memo})` : ""}
                      <button style={{ marginLeft: 8 }} onClick={() => beginEdit(row)}>
                        編集
                      </button>
                      <button style={{ marginLeft: 4 }} onClick={() => remove(row.id)}>
                        削除
                      </button>
                    </li>
                  );
                }
                // 編集フォーム
                return (
                  <li key={row.id} style={{ marginTop: 6 }}>
                    ・
                    <label style={{ marginLeft: 6 }}>
                      日付：
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        style={{ marginLeft: 6 }}
                      />
                    </label>
                    <label style={{ marginLeft: 10 }}>
                      金額：
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(Number(e.target.value))}
                        style={{ width: 90, marginLeft: 6 }}
                      />
                    </label>
                    <label style={{ marginLeft: 10 }}>
                      メモ：
                      <input
                        type="text"
                        value={editMemo}
                        onChange={(e) => setEditMemo(e.target.value)}
                        style={{ width: 260, marginLeft: 6 }}
                      />
                    </label>
                    <label style={{ marginLeft: 10 }}>
                      収入？
                      <input
                        type="checkbox"
                        checked={editIncome}
                        onChange={(e) => setEditIncome(e.target.checked)}
                        style={{ marginLeft: 6 }}
                      />
                    </label>
                    <button
                      style={{ marginLeft: 8 }}
                      onClick={() => saveEdit(row.id)}
                    >
                      保存
                    </button>
                    <button style={{ marginLeft: 6 }} onClick={cancelEdit}>
                      キャンセル
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      <button onClick={load} style={{ marginTop: 12 }}>
        再読み込み
      </button>
    </div>
  );
}

