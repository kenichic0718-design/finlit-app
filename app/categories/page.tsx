'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

'\''use client'\'';




import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabaseClient';

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
      {!rows && !error && <div>読み込み中...</div>}
      {rows && (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li key={c.id} className="border border-zinc-700 rounded p-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: c.color }} />
                {c.name}
              </span>
              <span className="opacity-70 text-sm">{c.kind}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

