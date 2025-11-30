'use client';

// app/settings/CategoryClient.tsx
import { useEffect, useState } from 'react';

type Kind = 'expense' | 'income';
type Item = { id: string; name: string; position: number | null };

export default function CategoryClient() {
  const [kind, setKind] = useState<Kind>('expense');
  const [name, setName] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    setMsg('');
    const r = await fetch(`/api/categories?kind=${kind}`, { credentials: 'include' });
    const j = await r.json().catch(() => ({} as any));
    if (j?.ok) {
      const list: Item[] = (j.items ?? []).slice().sort(
        (a: Item, b: Item) =>
          (a.position ?? 1e9) - (b.position ?? 1e9) ||
          a.name.localeCompare(b.name)
      );
      setItems(list);
    } else {
      setMsg(j?.error ?? 'Internal Server Error');
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, [kind]);

  async function add() {
    if (!name.trim()) return;
    setMsg('');
    const r = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ kind, name }),
    });
    const j = await r.json().catch(() => ({} as any));
    if (j?.ok) {
      setName('');
      load();
    } else {
      setMsg(j?.error ?? 'failed to add');
    }
  }

  async function move(id: string, op: 'top' | 'up' | 'down' | 'bottom') {
    setMsg('');
    const r = await fetch('/api/categories', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, op }),
    });
    const j = await r.json().catch(() => ({} as any));
    if (j?.ok) load();
    else setMsg(j?.error ?? 'failed to reorder');
  }

  async function remove(id: string) {
    setMsg('');
    const r = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const j = await r.json().catch(() => ({} as any));
    if (j?.ok) load();
    else setMsg(j?.error ?? 'failed to delete');
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">こんにちは。</p>

      <div className="space-x-3">
        <select
          className="border rounded px-2 py-1"
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
        >
          <option value="expense">expense</option>
          <option value="income">income</option>
        </select>
        <input
          className="border rounded px-2 py-1"
          placeholder="カテゴリ名"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="border rounded px-3 py-1" onClick={add}>
          追加
        </button>
      </div>

      {msg && <p className="text-red-600 text-sm">{msg}</p>}

      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-2">
            <span className="min-w-24">{it.name}</span>
            <div className="space-x-1">
              <button className="border rounded px-2 py-0.5" onClick={() => move(it.id, 'top')}>
                先頭へ
              </button>
              <button className="border rounded px-2 py-0.5" onClick={() => move(it.id, 'up')}>
                ↑
              </button>
              <button className="border rounded px-2 py-0.5" onClick={() => move(it.id, 'down')}>
                ↓
              </button>
              <button className="border rounded px-2 py-0.5" onClick={() => move(it.id, 'bottom')}>
                末尾へ
              </button>
              <button className="border rounded px-2 py-0.5" onClick={() => remove(it.id)}>
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

