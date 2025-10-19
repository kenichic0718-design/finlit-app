// app/settings/_PageClient.tsx
"use client";

import { useCallback, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  kind: "expense" | "income";
};

type Props = {
  expenseCategories?: Category[];
  incomeCategories?: Category[];
};

export default function PageClient({
  // デフォルトを空配列に固定（受け取りで undefined を潰す）
  expenseCategories = [],
  incomeCategories = [],
}: Props) {
  const [exp, setExp] = useState<Category[]>(expenseCategories ?? []);
  const [inc, setInc] = useState<Category[]>(incomeCategories ?? []);

  const lists = useMemo(
    () => [
      { title: "支出カテゴリ", kind: "expense" as const, data: exp, set: setExp },
      { title: "収入カテゴリ", kind: "income"  as const, data: inc, set: setInc },
    ],
    [exp, inc]
  );

  const renameCategory = useCallback(async (cat: Category) => {
    const next = window.prompt("新しいカテゴリ名を入力してください", cat.name)?.trim();
    if (!next) return;

    const res = await fetch(`/api/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ name: next }),
    });

    let payload: any = {};
    try {
      payload = await res.json();
    } catch {
      alert(`更新に失敗しました: ${res.status} ${res.statusText}`);
      return;
    }

    if (!res.ok || !payload?.ok) {
      alert(`更新に失敗しました: ${payload?.error ?? res.statusText}`);
      return;
    }

    const apply = (arr: Category[]) => arr.map((c) => (c.id === cat.id ? { ...c, name: next } : c));
    if (cat.kind === "expense") setExp((a) => apply(a));
    else setInc((a) => apply(a));
  }, []);

  const deleteCategory = useCallback(async (cat: Category) => {
    if (!confirm(`「${cat.name}」を削除します。よろしいですか？`)) return;

    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE", cache: "no-store" });

    let payload: any = {};
    try {
      payload = await res.json();
    } catch {
      alert(`削除に失敗しました: ${res.status} ${res.statusText}`);
      return;
    }

    if (!res.ok || !payload?.ok) {
      alert(`削除に失敗しました: ${payload?.error ?? res.statusText}`);
      return;
    }

    const filt = (arr: Category[]) => arr.filter((c) => c.id !== cat.id);
    if (cat.kind === "expense") setExp((a) => filt(a));
    else setInc((a) => filt(a));
  }, []);

  const addCategory = useCallback(async (kind: "expense" | "income") => {
    const name = window.prompt("追加するカテゴリ名を入力してください")?.trim();
    if (!name) return;

    const res = await fetch(`/api/categories/add`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ name, kind }),
    });

    let payload: any = {};
    try {
      payload = await res.json();
    } catch {
      alert(`追加に失敗しました: ${res.status} ${res.statusText}`);
      return;
    }

    if (!res.ok || !payload?.ok) {
      alert(`追加に失敗しました: ${payload?.error ?? res.statusText}`);
      return;
    }

    const item: Category = payload.item;
    if (item.kind === "expense") setExp((a) => [...a, item]);
    else setInc((a) => [...a, item]);
  }, []);

  return (
    <div className="space-y-10 p-4">
      <h1 className="text-2xl font-bold">設定</h1>

      {lists.map(({ title, kind, data }) => (
        <section key={kind} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              id={`add-${kind}`}
              name={`add-${kind}`}
              className="rounded border px-3 py-1 text-sm"
              onClick={() => addCategory(kind)}
            >
              追加
            </button>
          </div>

          <ul className="space-y-2">
            {(data ?? []).map((cat) => (
              <li key={cat.id} className="flex items-center gap-3">
                <span className="min-w-24">{cat.name}</span>
                <button
                  id={`rename-${cat.id}`}
                  name={`rename-${cat.id}`}
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => renameCategory(cat)}
                >
                  名称変更
                </button>
                <button
                  id={`delete-${cat.id}`}
                  name={`delete-${cat.id}`}
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => deleteCategory(cat)}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

