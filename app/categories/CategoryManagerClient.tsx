// app/categories/CategoryManagerClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Category = {
  id: number;
  name: string;
  is_income: boolean | null;
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export default function CategoryManagerClient() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [addExp, setAddExp] = useState('');
  const [addInc, setAddInc] = useState('');

  const expenses = useMemo(
    () => items.filter((c) => !c.is_income),
    [items]
  );
  const incomes = useMemo(
    () => items.filter((c) => !!c.is_income),
    [items]
  );

  async function reload() {
    setLoading(true);
    try {
      const data = await fetch('/api/categories', { cache: 'no-store' }).then(
        (r) => json<{ ok: boolean; items: Category[] }>(r)
      );
      setItems(data.items ?? []);
    } catch (e) {
      console.error(e);
      alert('カテゴリの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function add(name: string, is_income: boolean) {
    if (!name.trim()) return;
    const body = { name: name.trim(), is_income };
    try {
      await fetch('/api/categories/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(json);
      setAddExp('');
      setAddInc('');
      await reload();
    } catch (e) {
      console.error(e);
      alert('追加に失敗しました。');
    }
  }

  async function rename(id: number) {
    const current = items.find((x) => x.id === id);
    if (!current) return;
    const next = prompt('新しいカテゴリ名を入力してください', current.name);
    if (next == null) return;
    const name = next.trim();
    if (!name) return;

    setBusyId(id);
    try {
      await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      }).then(json);
      await reload();
    } catch (e) {
      console.error(e);
      alert('名称変更に失敗しました。');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number) {
    if (!confirm('このカテゴリを削除します。よろしいですか？')) return;
    setBusyId(id);
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' }).then(json);
      await reload();
    } catch (e) {
      console.error(e);
      alert('削除に失敗しました。');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-2">支出カテゴリ</h2>
        <div className="flex items-center gap-2 mb-3">
          <input
            value={addExp}
            onChange={(e) => setAddExp(e.target.value)}
            placeholder="例) 食費"
            className="border px-2 py-1 rounded w-48"
          />
          <button
            onClick={() => add(addExp, false)}
            className="px-3 py-1 rounded bg-black text-white"
          >
            追加
          </button>
        </div>

        {loading ? (
          <p>読み込み中…</p>
        ) : expenses.length === 0 ? (
          <p className="opacity-70">カテゴリがありません。</p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between border rounded px-3 py-2"
              >
                <span>{c.name}</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => rename(c.id)}
                    disabled={busyId === c.id}
                    className="text-blue-600 underline disabled:opacity-50"
                  >
                    名称変更
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    disabled={busyId === c.id}
                    className="text-red-600 underline disabled:opacity-50"
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">収入カテゴリ</h2>
        <div className="flex items-center gap-2 mb-3">
          <input
            value={addInc}
            onChange={(e) => setAddInc(e.target.value)}
            placeholder="例) 給与"
            className="border px-2 py-1 rounded w-48"
          />
          <button
            onClick={() => add(addInc, true)}
            className="px-3 py-1 rounded bg-black text-white"
          >
            追加
          </button>
        </div>

        {loading ? (
          <p>読み込み中…</p>
        ) : incomes.length === 0 ? (
          <p className="opacity-70">カテゴリがありません。</p>
        ) : (
          <ul className="space-y-2">
            {incomes.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between border rounded px-3 py-2"
              >
                <span>{c.name}</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => rename(c.id)}
                    disabled={busyId === c.id}
                    className="text-blue-600 underline disabled:opacity-50"
                  >
                    名称変更
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    disabled={busyId === c.id}
                    className="text-red-600 underline disabled:opacity-50"
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

