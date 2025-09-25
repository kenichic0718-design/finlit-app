// app/settings/SettingsCategories.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

type Kind = "expense" | "income";
type Item = { id: string; name: string; kind: Kind };

export default function SettingsCategories() {
  const [items, setItems] = useState<Item[]>([]);
  const [kind, setKind] = useState<Kind>("expense");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ensureProfile() {
    await fetch("/api/profile", { cache: "no-store" });
  }

  async function fetchAll() {
    setErr(null);
    const res = await fetch("/api/categories?kind=all", { cache: "no-store" });
    const json = await res.json();
    if (!json.ok) {
      setErr("カテゴリ取得に失敗しました");
      setItems([]);
      return;
    }
    setItems(json.items as Item[]);
  }

  useEffect(() => {
    // 初回：profile を用意してからカテゴリ取得
    ensureProfile().then(fetchAll);
  }, []);

  const expense = useMemo(() => items.filter((i) => i.kind === "expense"), [items]);
  const income  = useMemo(() => items.filter((i) => i.kind === "income"), [items]);

  async function onAdd() {
    if (!name.trim()) return;
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), kind }),
    });
    const json = await res.json();
    if (!json.ok) {
      setErr(json.error ?? "追加に失敗しました");
    } else {
      setName("");
      await fetchAll();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="kind"
            checked={kind === "expense"}
            onChange={() => setKind("expense")}
          />
          支出
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="kind"
            checked={kind === "income"}
            onChange={() => setKind("income")}
          />
          収入
        </label>

        <input
          className="input w-64"
          placeholder="例）食費 / 給与 / 交通 など"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn" onClick={onAdd} disabled={loading}>
          追加
        </button>
      </div>

      {err && <p className="text-red-500 text-sm">{err}</p>}

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">支出カテゴリ</h3>
          {expense.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだありません</p>
          ) : (
            <ul className="space-y-2">
              {expense.map((c) => (
                <li key={c.id} className="rounded bg-muted px-3 py-2 inline-block">{c.name}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">収入カテゴリ</h3>
          {income.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだありません</p>
          ) : (
            <ul className="space-y-2">
              {income.map((c) => (
                <li key={c.id} className="rounded bg-muted px-3 py-2 inline-block">{c.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        ここで編集したカテゴリは「記録」「予算」のプルダウンに即時反映されます。
      </p>
    </div>
  );
}

