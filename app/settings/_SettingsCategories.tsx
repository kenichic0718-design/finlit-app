// app/settings/_SettingsCategories.tsx
'use client';

import * as React from 'react';
import { fetchJson } from '@/app/_utils/fetchJson';
import type { Category } from '@/types/category';
import { toast } from '@/app/_utils/toast';

type Kind = 'income' | 'expense';

export default function SettingsCategories() {
  const [kind, setKind] = React.useState<Kind>('expense');
  const [items, setItems] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<Category[]>(`/api/categories?kind=${kind}`);
      setItems(data.sort(sorter));
    } catch (e: any) {
      setError(e?.message ?? '読み込みに失敗しました');
      toast('読み込みに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [kind]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onAdd = async () => {
    if (!newName.trim()) return;
    try {
      const created = await fetchJson<Category>('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), kind }),
      });
      setItems((prev) => [...prev, created].sort(sorter));
      setNewName('');
      toast('カテゴリを追加しました', 'success');
    } catch (e: any) {
      toast(e?.message ?? '追加に失敗しました', 'error');
    }
  };

  const onRename = async (id: string, name: string, original: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === original) return;
    try {
      setBusyId(id);
      const updated = await fetchJson<Category>(`/api/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: trimmed }),
      });
      setItems((prev) =>
        prev.map((c) => (c.id === id ? updated : c)).sort(sorter)
      );
      toast('名称を更新しました', 'success');
    } catch (e: any) {
      toast(e?.message ?? '名称変更に失敗しました', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return;
    try {
      setBusyId(id);
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((c) => c.id !== id));
      toast('削除しました', 'success');
    } catch {
      toast('削除に失敗しました', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const move = async (id: string, kindOp: 'up' | 'down' | 'top' | 'bottom') => {
    const idx = items.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const target = items[idx];

    let newPos = target.position;
    if (kindOp === 'up') newPos = Math.max(0, target.position - 5);
    if (kindOp === 'down') newPos = target.position + 5;
    if (kindOp === 'top') {
      const minPos = Math.min(...items.map((c) => c.position));
      newPos = Math.max(0, minPos - 10);
    }
    if (kindOp === 'bottom') {
      const maxPos = Math.max(...items.map((c) => c.position));
      newPos = maxPos + 10;
    }

    try {
      setBusyId(id);
      const updated = await fetchJson<Category>(`/api/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ position: newPos }),
      });
      setItems((prev) =>
        prev.map((c) => (c.id === id ? updated : c)).sort(sorter)
      );
      toast('並び順を更新しました', 'success');
    } catch {
      toast('並び替えに失敗しました', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">カテゴリ</h2>

      <div className="flex items-center gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
          className="rounded border px-2 py-1"
        >
          <option value="expense">expense</option>
          <option value="income">income</option>
        </select>

        <input
          placeholder="カテゴリ名"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="rounded border px-2 py-1"
        />
        <button
          onClick={onAdd}
          className="rounded border px-3 py-1 hover:bg-zinc-100"
        >
          追加
        </button>
      </div>

      {loading && <p className="text-sm text-zinc-500">読み込み中…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="space-y-2">
        {items.map((c) => (
          <Row
            key={c.id}
            item={c}
            busy={busyId === c.id}
            onRename={(val, original) => onRename(c.id, val, original)}
            onDelete={() => onDelete(c.id)}
            onUp={() => move(c.id, 'up')}
            onDown={() => move(c.id, 'down')}
            onTop={() => move(c.id, 'top')}
            onBottom={() => move(c.id, 'bottom')}
          />
        ))}
      </ul>
    </section>
  );
}

function sorter(a: Category, b: Category) {
  if (a.position !== b.position) return a.position - b.position;
  return a.name.localeCompare(b.name);
}

function Row(props: {
  item: Category;
  busy: boolean;
  onRename: (val: string, original: string) => void;
  onDelete: () => void;
  onUp: () => void;
  onDown: () => void;
  onTop: () => void;
  onBottom: () => void;
}) {
  const { item, busy } = props;
  const [val, setVal] = React.useState(item.name);

  return (
    <li className="flex items-center gap-2">
      <span className="rounded border px-2 py-1 text-xs opacity-70">
        {item.kind}
      </span>

      <input
        value={val}
        onChange={(e) => setVal(e.currentTarget.value)}
        onBlur={() => props.onRename(val, item.name)}
        disabled={busy}
        className="min-w-[180px] rounded border px-2 py-1 disabled:opacity-60"
      />

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={props.onTop}
          disabled={busy}
          className="rounded border px-2 py-1 disabled:opacity-60"
        >
          先頭へ
        </button>
        <button
          onClick={props.onUp}
          disabled={busy}
          className="rounded border px-2 py-1 disabled:opacity-60"
        >
          ↑
        </button>
        <button
          onClick={props.onDown}
          disabled={busy}
          className="rounded border px-2 py-1 disabled:opacity-60"
        >
          ↓
        </button>
        <button
          onClick={props.onBottom}
          disabled={busy}
          className="rounded border px-2 py-1 disabled:opacity-60"
        >
          末尾へ
        </button>
        <button
          onClick={props.onDelete}
          disabled={busy}
          className="rounded border px-2 py-1 text-red-600 disabled:opacity-60"
        >
          削除
        </button>
      </div>
    </li>
  );
}
