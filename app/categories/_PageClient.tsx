'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // ← ここを修正（@/src → @/lib）

type Category = { id: string; name: string; kind: 'expense' | 'income'; color: string };

export default function CategoriesPage() {
  const [rows, setRows] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);
      setRows(null);
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        if (error) setError(error.message);
        else setRows((data as Category[]) ?? []);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    })();
  }, []);

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">カテゴリ</h1>
      {error && <div className="text-red-400 text-sm">エラー: {error}</div>}
      {!rows && !error && <div className="text-sm text-neutral-400">読込中...</div>}
      {rows && rows.length === 0 && <div className="text-sm text-neutral-400">カテゴリがありません</div>}
      {rows && rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li key={c.id} className="rounded border border-white/10 px-3 py-2 flex items-center justify-between">
              <span>{c.name}</span>
              <span className="text-xs text-neutral-400">{c.kind}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

