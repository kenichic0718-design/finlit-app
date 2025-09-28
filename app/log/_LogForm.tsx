"use client";

import { useEffect, useMemo, useState } from "react";

type Kind = "expense" | "income";

type Category = {
  id: string;
  name: string;
  kind: Kind;
  color?: string | null;
  profile_id?: string | null;
  order_index?: number | null;
};

type CategoriesResp =
  | { ok: true; items: Category[] }
  | { ok: false; error: string };

type CreateCategoryResp =
  | { ok: true; item: Category }
  | { ok: false; error: string };

const CREATE_VALUE = "__create__";

// 安全に JSON を読む小ヘルパー（HTML が返ってきた場合にも堅牢）
async function safeJson<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    // HTML などを返した場合は text として読んでエラー化
    const text = await res.text();
    throw new Error(text || "Server returned non-JSON response");
  }
  return (await res.json()) as T;
}

export default function LogForm() {
  const [kind, setKind] = useState<Kind>("expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [catsError, setCatsError] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState(false);

  // 1) カテゴリ取得
  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoadingCats(true);
      setCatsError(null);
      try {
        const res = await fetch(`/api/categories?kind=${kind}`, { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || "カテゴリ取得に失敗しました");
        }
        const data = await safeJson<CategoriesResp>(res);
        if (aborted) return;
        if (!("ok" in data) || data.ok !== true) {
          setCatsError((data as any)?.error ?? "カテゴリ取得に失敗しました");
          setCategories([]);
          setCategoryId("");
          return;
        }
        setCategories(data.items);
        // 既存選択の整合性
        const stillExists = data.items.some((c) => c.id === categoryId);
        if (!stillExists) setCategoryId("");
      } catch (e: any) {
        if (!aborted) {
          setCatsError(e?.message || "カテゴリ取得に失敗しました");
          setCategories([]);
          setCategoryId("");
        }
      } finally {
        if (!aborted) setLoadingCats(false);
      }
    })();
    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const selectOptions = useMemo(() => {
    const base = categories.slice().sort((a, b) => {
      // order_index がある場合はそれを優先
      const ao = a.order_index ?? 0;
      const bo = b.order_index ?? 0;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
    return base;
  }, [categories]);

  // 2) セレクト変更（新規作成もここから）
  const onChangeCategory = async (value: string) => {
    if (value !== CREATE_VALUE) {
      setCategoryId(value);
      return;
    }
    // 新規作成フロー
    const name = window.prompt("新しいカテゴリ名を入力してください（例：食費）");
    if (name == null) {
      // キャンセル
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      alert("カテゴリ名が空です。");
      return;
    }

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, kind }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "カテゴリの作成に失敗しました。");
      }
      const data = await safeJson<CreateCategoryResp>(res);
      if (!data.ok) {
        throw new Error(data.error ?? "カテゴリの作成に失敗しました。");
      }

      // 成功: 一旦ローカル反映
      const created = data.item;
      setCategories((prev) => (prev.some((c) => c.id === created.id) ? prev : [...prev, created]));
      setCategoryId(created.id);

      // 念のためサーバー最新版を再取得（並び順などが変わる可能性に備える）
      try {
        const ref = await fetch(`/api/categories?kind=${kind}`, { cache: "no-store" });
        if (ref.ok) {
          const refJson = await safeJson<CategoriesResp>(ref);
          if (refJson.ok) setCategories(refJson.items);
        }
      } catch {}
    } catch (e: any) {
      alert(e?.message || "カテゴリの作成に失敗しました。");
    }
  };

  // 3) 記録の送信（/api/logs に合わせています）
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitOk(false);
    setSubmitError(null);

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setSubmitError("金額を正しく入力してください。");
      return;
    }
    if (!categoryId) {
      setSubmitError("カテゴリを選択してください。");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, kind, category_id: categoryId }),
      });

      const okJson = await safeJson<{ ok?: boolean; error?: string }>(res).catch(async () => {
        const text = await res.text().catch(() => "");
        throw new Error(text || "記録に失敗しました。");
      });

      if (!res.ok || okJson.ok === false) {
        throw new Error(okJson?.error ?? "記録に失敗しました。");
      }
      setSubmitOk(true);
      setAmount("");
      // 選択カテゴリは維持（連続入力を想定）
    } catch (err: any) {
      setSubmitError(err?.message ?? "記録に失敗しました。");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">記録</h1>

      {/* 種別切替 */}
      <div className="mb-6 flex gap-6">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="kind"
            value="expense"
            checked={kind === "expense"}
            onChange={() => setKind("expense")}
          />
          <span>支出</span>
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="kind"
            value="income"
            checked={kind === "income"}
            onChange={() => setKind("income")}
          />
          <span>収入</span>
        </label>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
        {/* 金額 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm opacity-80">金額</label>
          <input
            inputMode="numeric"
            placeholder="例) 500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-md bg-neutral-800 px-3 py-2 outline-none ring-1 ring-neutral-700 focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* カテゴリ */}
        <div className="flex flex-col gap-2">
          <label className="text-sm opacity-80">カテゴリ</label>
          <select
            value={categoryId}
            onChange={(e) => onChangeCategory(e.target.value)}
            className="rounded-md bg-neutral-800 px-3 py-2 outline-none ring-1 ring-neutral-700 focus:ring-2 focus:ring-sky-500"
            disabled={loadingCats}
          >
            <option value="">{loadingCats ? "読み込み中..." : "(該当なし)"}</option>
            {selectOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={CREATE_VALUE}>＋ 新しいカテゴリを作成</option>
          </select>
          {catsError && <p className="text-sm text-red-400">{catsError}</p>}
        </div>

        {/* 送信 */}
        <div className="flex items-end">
          <button
            type="submit"
            disabled={submitLoading}
            className="rounded-md bg-sky-600 px-5 py-2 font-medium disabled:opacity-60"
          >
            {submitLoading ? "記録中..." : "記録する"}
          </button>
        </div>

        {/* フィードバック */}
        <div className="md:col-span-3">
          {submitError && <p className="mt-1 text-sm text-red-400">{submitError}</p>}
          {submitOk && <p className="mt-1 text-sm text-emerald-400">記録しました！</p>}
        </div>
      </form>
    </div>
  );
}
