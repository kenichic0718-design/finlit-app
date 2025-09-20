'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getCurrentProfileId } from "../_utils/getCurrentProfileId";

type Category = { id: string; name: string; kind: "expense" | "income"; color: string };

export default function CategoriesPage() {
  const supabase = createClientComponentClient();

  const [list, setList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // フォーム
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [color, setColor] = useState("#22c55e");

  async function fetchList() {
    const profileId = await getCurrentProfileId(supabase);
    if (!profileId) return;
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, kind, color")
      .eq("profile_id", profileId)
      .order("name", { ascending: true });
    if (!error && data) setList(data as Category[]);
  }

  useEffect(() => {
    fetchList();
  }, []); // fetchList 内で supabase を使うが、初回読み込みだけでOK

  async function handleAdd() {
    if (!name.trim()) {
      alert("カテゴリ名を入力してください");
      return;
    }
    setLoading(true);
    try {
      const profileId = await getCurrentProfileId(supabase);
      if (!profileId) throw new Error("profile_id を取得できませんでした");

      const payload = {
        profile_id: profileId,
        name: name.trim(),
        kind,
        color,
      };
      const { error } = await supabase.from("categories").insert(payload);
      if (error) throw error;

      setName("");
      await fetchList();
    } catch (e: any) {
      alert(`保存に失敗しました: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">カテゴリ管理</h1>

      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="underline opacity-80 hover:opacity-100">ダッシュボード</Link>
        <span> / </span>
        <span className="opacity-70">カテゴリ</span>
      </div>

      {/* 追加フォーム */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="flex flex-col">
          <label className="text-sm mb-1">カテゴリ名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded px-3 py-2 bg-black/20 border-white/20"
            placeholder="例) アルバイト収入"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm mb-1">種別</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "expense" | "income")}
            className="border rounded px-3 py-2 bg-black/20 border-white/20"
          >
            <option value="expense">支出</option>
            <option value="income">収入</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm mb-1">カラー</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-[42px] w-full border rounded bg-black/20 border-white/20"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleAdd}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-brand text-black border border-brand/40 hover:opacity-90 disabled:opacity-50 w-full"
          >
            追加
          </button>
        </div>
      </div>

      {/* 一覧 */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">名前</th>
            <th className="px-4 py-2 text-left">種別</th>
            <th className="px-4 py-2 text-left">色</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td className="px-4 py-4" colSpan={3}>
                まだカテゴリがありません。フォームから追加してください。
              </td>
            </tr>
          ) : (
            list.map((c) => (
              <tr key={c.id} className="border-t border-white/10">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.kind === "income" ? "収入" : "支出"}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block w-4 h-4 rounded"
                      style={{ backgroundColor: c.color }}
                      aria-label={c.color}
                      title={c.color}
                    />
                    <span className="opacity-70">{c.color}</span>
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
