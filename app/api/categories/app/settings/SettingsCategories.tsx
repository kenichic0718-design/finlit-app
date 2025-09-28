// app/settings/SettingsCategories.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

type Kind = "expense" | "income";
type Item = { id: string; name: string; kind: Kind };

export default function SettingsCategories() {
  const [items, setItems] = useState<Item[]>([]);
  const [kind, setKind] = useState<Kind>("expense");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ensureProfile() {
    try {
      await fetch("/api/profile", { cache: "no-store" });
    } catch {}
  }

  async function fetchAll() {
    setErr(null);
    try {
      const res = await fetch("/api/categories?kind=all", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) {
        setErr(json.error ?? "カテゴリ取得に失敗しました");
        setItems([]);
        return;
      }
      setItems(json.items as Item[]); // order_index → name の順で返ってくる想定
    } catch {
      setErr("カテゴリ取得に失敗しました");
      setItems([]);
    }
  }

  useEffect(() => {
    ensureProfile().then(fetchAll);
  }, []);

  const expense = useMemo(() => items.filter((i) => i.kind === "expense"), [items]);
  const income  = useMemo(() => items.filter((i) => i.kind === "income"), [items]);

  // 追加
  async function onAdd() {
    if (!name.trim()) return;
    setLoading(true);
    setErr(null);
    try {
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
    } catch {
      setErr("追加に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  // 名称変更
  async function rename(id: string, current: string) {
    const next = window.prompt("新しい名称を入力してください", current);
    if (!next || next.trim() === current) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next.trim() }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "名称変更に失敗しました");
      await fetchAll();
    } catch (e: any) {
      alert(e?.message ?? "名称変更に失敗しました");
    }
  }

  // 削除
  async function remove(id: string) {
    if (!confirm("このカテゴリを削除します。よろしいですか？")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json?.error);
      await fetchAll();
    } catch (e: any) {
      alert(
        e?.message ??
          "削除に失敗しました。記録で使用中のカテゴリは削除できません。"
      );
    }
  }

  // 並び替え（共通ハンドラ）
  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId !== source.droppableId ||
      destination.index === source.index
    ) {
      return;
    }

    const targetKind: Kind =
      destination.droppableId === "expense" ? "expense" : "income";
    const list = targetKind === "expense" ? expense : income;

    // 並び替え（ローカル・楽観更新）
    const from = source.index;
    const to = destination.index;
    const newList = list.slice();
    const moved = newList.splice(from, 1)[0];
    newList.splice(to, 0, moved);

    setItems((prev) => {
      const others = prev.filter((p) => p.kind !== targetKind);
      return [...others, ...newList];
    });

    // サーバ永続化
    try {
      const ids = newList.map((i) => i.id);
      const res = await fetch("/api/categories/sort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: targetKind, ids }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        throw new Error(json?.error ?? "並び順の保存に失敗しました");
      }
    } catch (e: any) {
      alert(e?.message ?? "並び順の保存に失敗しました");
      fetchAll(); // 失敗時はリロード
    }
  }

  return (
    <div className="space-y-4">
      {/* 追加フォーム */}
      <div className="flex flex-wrap items-center gap-4">
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
          className="rounded-md bg-neutral-800 px-3 py-2 outline-none ring-1 ring-neutral-700 focus:ring-2 focus:ring-sky-500 w-64"
          placeholder="例）食費 / 給与 / 交通 など"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="rounded-md bg-sky-600 px-4 py-2 font-medium disabled:opacity-60"
          onClick={onAdd}
          disabled={loading}
        >
          追加
        </button>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 支出 */}
          <section className="rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold mb-3">支出カテゴリ</h3>
            <Droppable droppableId="expense">
              {(provided) => (
                <ul
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col gap-2"
                >
                  {expense.length === 0 ? (
                    <p className="text-sm text-white/60">まだありません</p>
                  ) : (
                    expense.map((c, idx) => (
                      <Draggable key={c.id} draggableId={c.id} index={idx}>
                        {(p, snapshot) => (
                          <li
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                            style={{
                              ...p.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.7 : 1,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="text-white/70 cursor-grab select-none px-2"
                                title="ドラッグして並び替え"
                                aria-hidden
                              >
                                ⋮⋮
                              </span>
                              <span className="truncate">{c.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                className="rounded-md bg-white/10 px-2 py-1 text-sm hover:bg-white/15"
                                onClick={() => rename(c.id, c.name)}
                              >
                                名称変更
                              </button>
                              <button
                                className="rounded-md bg-red-600/80 px-2 py-1 text-sm hover:bg-red-600"
                                onClick={() => remove(c.id)}
                              >
                                削除
                              </button>
                            </div>
                          </li>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </section>

          {/* 収入 */}
          <section className="rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold mb-3">収入カテゴリ</h3>
            <Droppable droppableId="income">
              {(provided) => (
                <ul
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col gap-2"
                >
                  {income.length === 0 ? (
                    <p className="text-sm text-white/60">まだありません</p>
                  ) : (
                    income.map((c, idx) => (
                      <Draggable key={c.id} draggableId={c.id} index={idx}>
                        {(p, snapshot) => (
                          <li
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                            style={{
                              ...p.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.7 : 1,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="text-white/70 cursor-grab select-none px-2"
                                title="ドラッグして並び替え"
                                aria-hidden
                              >
                                ⋮⋮
                              </span>
                              <span className="truncate">{c.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                className="rounded-md bg-white/10 px-2 py-1 text-sm hover:bg-white/15"
                                onClick={() => rename(c.id, c.name)}
                              >
                                名称変更
                              </button>
                              <button
                                className="rounded-md bg-red-600/80 px-2 py-1 text-sm hover:bg-red-600"
                                onClick={() => remove(c.id)}
                              >
                                削除
                              </button>
                            </div>
                          </li>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </section>
        </div>
      </DragDropContext>

      <p className="text-xs text-white/60">
        並び替えは、項目をそのまま掴んで上下へドラッグしてください（保存は自動）。
      </p>
    </div>
  );
}

