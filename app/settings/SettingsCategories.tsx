// app/settings/SettingsCategories.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/telemetry";

type Kind = "expense" | "income";

type ApiCategory = {
  id: string;
  name: string | null;
  kind: Kind;
  is_active?: boolean | null;
};

type ApiGetResponse =
  | {
      ok: boolean;
      items: ApiCategory[];
      error?: string;
      detail?: string;
    }
  | ApiCategory[];

type ApiPostResponse =
  | {
      ok: boolean;
      item?: ApiCategory;
      error?: string;
      detail?: string;
    }
  | ApiCategory;

type Category = {
  id: string;
  name: string;
  kind: Kind;
  isActive: boolean;
};

type CategorySectionProps = {
  title: string;
  kind: Kind;
  categories: Category[];
  onNameChange: (id: string, name: string) => void;
  onNameBlur: (id: string) => void;
  onToggle: (cat: Category, next: boolean) => void;
  onAdd: (kind: Kind) => void;
  disabled?: boolean;
};

function mapApiCategory(api: ApiCategory): Category {
  const baseName = (api.name ?? "").trim();
  return {
    id: api.id,
    name: baseName || "名称未設定",
    kind: api.kind,
    isActive: api.is_active ?? true,
  };
}

function mapGetResponse(json: ApiGetResponse): Category[] {
  if (Array.isArray(json)) {
    return json.map(mapApiCategory);
  }
  if (!json.ok || !Array.isArray(json.items)) {
    return [];
  }
  return json.items.map(mapApiCategory);
}

export default function SettingsCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // まずは全カテゴリ取得（支出・収入まとめて）
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/categories", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        const json = (await res.json().catch(() => null)) as
          | ApiGetResponse
          | null;

        if (!res.ok || !json) {
          if (!cancelled) {
            setError(
              "カテゴリの取得に失敗しました。時間をおいて再度お試しください。"
            );
          }
          return;
        }

        const mapped = mapGetResponse(json);
        if (!cancelled) {
          setCategories(mapped);
        }
      } catch (_err) {
        if (!cancelled) {
          setError(
            "ネットワークエラーによりカテゴリの取得に失敗しました。"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.kind === "expense"),
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.kind === "income"),
    [categories]
  );

  function updateLocalCategory(id: string, patch: Partial<Category>) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }

  async function reloadAll() {
    try {
      const res = await fetch("/api/categories", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const json = (await res.json().catch(() => null)) as
        | ApiGetResponse
        | null;
      if (!res.ok || !json) {
        setError("カテゴリの再取得に失敗しました。");
        return;
      }
      const mapped = mapGetResponse(json);
      setCategories(mapped);
    } catch (_err) {
      setError("カテゴリの再取得に失敗しました。");
    }
  }

  async function saveCategoryPatch(
    id: string,
    patch: { name?: string; isActive?: boolean }
  ) {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json) {
        const msg =
          (json && (json.error || json.detail)) ||
          "カテゴリの更新に失敗しました。";
        throw new Error(msg);
      }

      // PATCH /[id] は更新後の1件を返す想定
      const updatedApi = json as ApiCategory;
      const updatedCat = mapApiCategory(updatedApi);

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? updatedCat : c))
      );

      return updatedCat;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "カテゴリの更新に失敗しました。";
      setError(msg);
      // サーバー側の状態で取り直す
      await reloadAll();
      throw err;
    } finally {
      setSaving(false);
    }
  }

  // 名称変更：入力中はローカルだけ、blur 時にサーバーへ反映
  function handleNameChange(id: string, name: string) {
    updateLocalCategory(id, { name });
  }

  async function handleNameBlur(id: string) {
    const target = categories.find((c) => c.id === id);
    if (!target) return;

    const trimmed = target.name.trim();
    if (!trimmed) {
      setError("カテゴリ名は1文字以上で入力してください。");
      await reloadAll();
      return;
    }

    try {
      const updated = await saveCategoryPatch(id, { name: trimmed });

      // ★ テレメトリ: カテゴリ名の変更が確定したタイミング
      // ※blur → PATCH が成功したときだけ送信（回数をざっくりカウントする用途）
      void trackEvent("category_renamed", {
        category_id: updated.id,
        kind: updated.kind,
      });
    } catch {
      // saveCategoryPatch 内でエラー処理 & reloadAll 済みなのでここでは何もしない
    }
  }

  // ON/OFF 切り替え
  async function handleToggle(cat: Category, next: boolean) {
    // 極力 UI を止めないために楽観的更新
    updateLocalCategory(cat.id, { isActive: next });

    try {
      const updated = await saveCategoryPatch(cat.id, { isActive: next });

      // ★ テレメトリ: カテゴリの ON/OFF が切り替わった
      void trackEvent("category_toggled", {
        category_id: updated.id,
        kind: updated.kind,
        new_value: updated.isActive,
      });
    } catch {
      // saveCategoryPatch 内でエラー処理 & reloadAll 済みなので、ここでは何もしない
    }
  }

  // 追加
  async function handleAdd(kind: Kind) {
    const name = window.prompt("新しく追加するカテゴリ名を入力してください。");
    if (!name) return;

    const trimmed = name.trim();
    if (!trimmed) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name: trimmed }),
      });

      const json = (await res.json().catch(() => null)) as
        | ApiPostResponse
        | null;

      if (!res.ok || !json) {
        const msg =
          (json && ("error" in json ? json.error : undefined)) ||
          (json && ("detail" in json ? json.detail : undefined)) ||
          "カテゴリの追加に失敗しました。";
        throw new Error(msg);
      }

      let api: ApiCategory | null = null;

      if (!Array.isArray(json) && "item" in json && json.item) {
        api = json.item;
      } else if (!Array.isArray(json)) {
        api = json as ApiCategory;
      }

      if (!api) {
        throw new Error("カテゴリの追加レスポンスが不正です。");
      }

      const cat = mapApiCategory(api);
      setCategories((prev) => [...prev, cat]);

      // ★ テレメトリ: カテゴリを新規追加
      void trackEvent("category_added", {
        category_id: cat.id,
        kind: cat.kind,
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "カテゴリの追加に失敗しました。";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">
          カテゴリを読み込んでいます...
        </p>
      ) : (
        <>
          <CategorySection
            title="支出カテゴリ"
            kind="expense"
            categories={expenseCategories}
            onNameChange={handleNameChange}
            onNameBlur={handleNameBlur}
            onToggle={handleToggle}
            onAdd={handleAdd}
            disabled={saving}
          />
          <CategorySection
            title="収入カテゴリ"
            kind="income"
            categories={incomeCategories}
            onNameChange={handleNameChange}
            onNameBlur={handleNameBlur}
            onToggle={handleToggle}
            onAdd={handleAdd}
            disabled={saving}
          />
        </>
      )}
    </div>
  );
}

function CategorySection(props: CategorySectionProps) {
  const {
    title,
    kind,
    categories,
    onNameChange,
    onNameBlur,
    onToggle,
    onAdd,
    disabled,
  } = props;

  const hasCategories = categories.length > 0;

  return (
    <section className="space-y-3 rounded-xl border bg-white/95 px-3 py-3 shadow-sm dark:bg-slate-900/80 dark:border-slate-700 sm:px-4 sm:py-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          {title}
        </h2>
        <button
          type="button"
          className="self-start rounded-md border px-3 py-1 text-xs hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
          onClick={() => onAdd(kind)}
          disabled={disabled}
        >
          ＋ 追加
        </button>
      </header>

      <div className="space-y-2">
        {!hasCategories ? (
          <p className="text-xs text-muted-foreground">
            まだカテゴリがありません。「＋追加」から作成できます。
          </p>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col gap-2 rounded-lg border bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-3"
            >
              <div className="w-full flex-1">
                <input
                  type="text"
                  className="w-full rounded-md border border-transparent bg-transparent px-1.5 py-1.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:border-emerald-400 dark:focus:bg-slate-900"
                  value={cat.name}
                  onChange={(e) => onNameChange(cat.id, e.target.value)}
                  onBlur={() => onNameBlur(cat.id)}
                  disabled={disabled}
                />
              </div>
              <label className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={cat.isActive}
                  onChange={(e) => onToggle(cat, e.target.checked)}
                  disabled={disabled}
                />
                <span>使う</span>
              </label>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

