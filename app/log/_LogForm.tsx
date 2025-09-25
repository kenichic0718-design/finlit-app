"use client";

import { useEffect, useMemo, useState } from "react";

type Kind = "expense" | "income";

type Category = {
  id: string;
  name: string;
  kind: Kind;
  color?: string | null;
  profile_id?: string | null;
};

type CategoriesResp =
  | { ok: true; items: Category[] }
  | { ok: false; error: string };

type CreateCategoryResp =
  | { ok: true; item: Category }
  | { ok: false; error: string };

const CREATE_VALUE = "__create__";

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
        const res = await fetch(`/api/categories?kind=${kind}`, {
          cache: "no-store",
        });
        const data: CategoriesResp = await res.json();
        if (aborted) return;
        if (!data.ok) {
          setCatsError(data.error ?? "カテゴリ取得に失敗しました");
          setCategories([]);
          setCategoryId("");
          return;
        }
        setCategories(data.items);
        // 既存の選択が別種別になったらリセット
        const stillExists =
          data.items.find((c) => c.id === categoryId) !== undefined;
        if (!stillExists) setCategoryId("");
      } catch (e) {
        if (!aborted) {
          setCatsError("カテゴリ取得に失敗しました");
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
    const base = categories
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
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
    if (!name) {
      // キャンセル or 空文字
      // 直前の選択に戻す
      setCategoryId("");
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      alert("カテゴリ名が空です。");
      setCategoryId("");
      return;
    }

    try {
      // API: POST /api/categories へ作成依頼
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, kind }),
      });
      const data: CreateCategoryResp = await res.json();
      if (!data.ok) {
        alert(data.error ?? "カテゴリの作成に失敗しました。");
        setCategoryId("");
        return;
      }

      // 成功: 一旦ローカルに反映（再取得でもOK）
      const created = data.item;
      setCategories((prev) => {
        // 重複防止
        const exists = prev.some((c) => c.id === created.id);
        const next = exists ? prev : [...prev, created];
        return next;
      });
      setCategoryId(created.id);
    } catch (e) {
      alert("カテゴリの作成に失敗しました。");
      setCategoryId("");
    }
  };

  // 3) 記録の送信（既存のAPIに合わせてください）
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
      // ここはあなたの既存エンドポイントに合わせてください。
      // 例1: /api/logs/add を使っていた場合
      // const res = await fetch("/api/logs/add", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ amount: value, kind, category_id: categoryId }),
      // });

      // 例2: /api/logs を使う場合（お好みで）
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, kind, category_id: categoryId }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.ok === false) {
        throw new Error(data?.error ?? "記録に失敗しました。");
      }
      setSubmitOk(true);
      setAmount("");
      // 選択はそのままにしておく（連続入力向け）
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
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="kind"
            value="expense"
            checked={kind === "expense"}
            onChange={() => setKind("expense")}
          />
          <span>支出</span>
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
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
          {catsError && (
            <p className="text-sm text-red-400">
              {catsError}
            </p>
          )}
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
          {submitError && (
            <p className="mt-1 text-sm text-red-400">{submitError}</p>
          )}
          {submitOk && (
            <p className="mt-1 text-sm text-emerald-400">記録しました！</p>
          )}
        </div>
      </form>
    </div>
  );
}

