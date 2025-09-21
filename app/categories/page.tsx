"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Category = { id: string; name: string; kind: "expense" | "income"; color: string };

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [color, setColor] = useState("#22c55e");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id,name,kind,color")
          .order("name", { ascending: true });
        if (error) throw error;
        setItems(data ?? []);
      } catch (e: any) {
        alert(`カテゴリ取得失敗: ${e?.message ?? e}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addCategory = async () => {
    if (!name) {
      alert("カテゴリ名を入力してください");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("categories").insert({ name, kind, color });
      if (error) throw error;

      const { data: data2, error: rErr } = await supabase
        .from("categories")
        .select("id,name,kind,color")
        .order("name", { ascending: true });
      if (rErr) throw rErr;

      setItems(data2 ?? []);
      setName("");
    } catch (e: any) {
      alert(`追加に失敗しました: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-slate-200">
      <h1 className="mb-6 text-2xl font-bold">カテゴリ</h1>

      <section className="mb-8">
        <div className="mb-3 text-lg font-semibold">追加</div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="rounded bg-slate-800 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="カテゴリ名（例：通信）"
          />
          <select
            className="rounded bg-slate-800 px-3 py-2"
            value={kind}
            onChange={(e) => setKind(e.target.value as "expense" | "income")}
          >
            <option value="expense">支出</option>
            <option value="income">収入</option>
          </select>
          <input
            type="color"
            className="h-10 w-16 cursor-pointer rounded bg-slate-800"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            title="カラー"
          />
          <button
            onClick={addCategory}
            disabled={loading}
            className="rounded bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500 disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 text-lg font-semibold">一覧</div>
        {loading ? (
          <div className="opacity-80">読み込み中…</div>
        ) : items.length === 0 ? (
          <div className="opacity-80">まだカテゴリがありません。上のフォームから追加してください。</div>
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded bg-slate-800 px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="inline-block h-4 w-4 rounded" style={{ background: c.color }} />
                  <span>{c.name}</span>
                </div>
                <span className="opacity-70">{c.kind === "expense" ? "支出" : "収入"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

