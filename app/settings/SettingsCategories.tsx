"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Category = {
  id: string;
  name: string;
  order_index: number | null; // 念のため null も許容
};

type ApiCategory = {
  id: string;
  name: string;
  order_index: number | null;
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return (await res.json()) as ApiCategory[];
};

export default function SettingsCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初回ロード
  useEffect(() => {
    (async () => {
      try {
        const rows = await fetcher("/api/categories");
        // order_index が null/未設定のものは後ろに回し、安定ソート
        const sorted = [...rows].sort((a, b) => {
          const ai = a.order_index ?? Number.MAX_SAFE_INTEGER;
          const bi = b.order_index ?? Number.MAX_SAFE_INTEGER;
          if (ai !== bi) return ai - bi;
          // order_index が同値のときは name で仮並び
          return a.name.localeCompare(b.name, "ja");
        });
        setCategories(sorted);
      } catch (e: any) {
        setError(e?.message ?? "初期ロードに失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // dnd センサー（ハンドルで掴む前提でも PointerSensor は必要）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 }, // 誤ドラッグ防止
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const ids = useMemo(() => categories.map((c) => c.id), [categories]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));

    // 楽観的更新
    const next = arrayMove(categories, oldIndex, newIndex).map((c, i) => ({
      ...c,
      order_index: i,
    }));

    const prev = categories;
    setCategories(next);

    // 永続化（失敗時はロールバック）
    try {
      setSaving(true);
      setError(null);

      const payload = next.map((c, i) => ({
        id: c.id,
        order_index: i,
      }));

      const res = await fetch("/api/categories/sort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: payload }),
      });

      if (!res.ok) {
        const msg = await safeText(res);
        throw new Error(
          `保存に失敗しました（${res.status}）: ${msg || "unknown"}`
        );
      }
    } catch (e: any) {
      setCategories(prev);
      setError(e?.message ?? "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-600">
        カテゴリを読み込み中です…
      </div>
    );
  }

  return (
    <div className="max-w-xl p-4">
      <h1 className="text-lg font-semibold mb-2">カテゴリの並び替え</h1>
      <p className="text-sm text-gray-600 mb-4">
        左の<strong>☰</strong>（三本線）を掴んで上下にドラッグすると並び替えできます。
      </p>

      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {saving && (
        <div className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          保存中…
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {categories.map((cat) => (
              <SortableRow key={cat.id} category={cat} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableRow({ category }: { category: Category }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        "flex items-center justify-between rounded-lg border",
        "bg-white px-3 py-2 shadow-sm",
        isDragging ? "opacity-80 ring-2 ring-blue-300" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        {/* 並び替えハンドル（ここに listeners を付与） */}
        <button
          {...attributes}
          {...listeners}
          aria-label="並び替え"
          title="並び替え"
          className={[
            "select-none text-xl leading-none",
            "cursor-grab active:cursor-grabbing",
            "px-1 py-1",
          ].join(" ")}
          // フォーカスで見えるように
          style={{ outline: "none" }}
        >
          {/* 視認性の高い記号（≡ より ☰ ） */}
          ☰
        </button>

        <span className="text-sm">{category.name}</span>
      </div>

      {/* 必要なら編集/削除ボタンなど */}
      {/* <div className="flex gap-2">
        <button className="text-xs text-gray-500 underline">編集</button>
      </div> */}
    </li>
  );
}

// レスポンス本文を安全に取得（テキスト化に失敗しても落ちないように）
async function safeText(res: Response): Promise<string | null> {
  try {
    return await res.text();
  } catch {
    return null;
  }
}

