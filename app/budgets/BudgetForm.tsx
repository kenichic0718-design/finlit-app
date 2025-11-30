// app/budgets/BudgetForm.tsx
"use client";

import { useEffect, useState } from "react";

type Props = {
  ym: string; // YYYY-MM
  onSaved?: () => void;
};

type Category = {
  id: string;
  name: string;
  kind: "expense" | "income";
};

type ApiCategory = {
  id: string;
  name: string | null;
  kind: "expense" | "income" | null;
};

type ApiResult<T> = {
  ok: boolean;
  items?: T[];
  error?: string;
  detail?: string;
};

export default function BudgetForm({ ym, onSaved }: Props) {
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [loadingCats, setLoadingCats] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 種別ごとのカテゴリ一覧を取得
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingCats(true);
      setError(null);
      try {
        const res = await fetch(`/api/categories?kind=${kind}`, {
          credentials: "include",
          cache: "no-store",
        });
        const json: ApiResult<ApiCategory> = await res.json();

        if (cancelled) return;

        if (!json.ok) {
          setError(json.error ?? "カテゴリの取得に失敗しました。");
          setCategories([]);
          setCategoryId("");
          return;
        }

        const list: Category[] = (json.items ?? []).map((c) => ({
          id: c.id,
          name: c.name ?? "(名称未設定)",
          kind: (c.kind ?? kind) as "expense" | "income",
        }));

        setCategories(list);
        if (list.length > 0) {
          setCategoryId(list[0].id);
        } else {
          setCategoryId("");
        }
      } catch (e: any) {
        if (cancelled) return;
        console.error("[BudgetForm] categories fetch error", e);
        setError("カテゴリの取得中にエラーが発生しました。");
        setCategories([]);
        setCategoryId("");
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [kind]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posting) return;

    if (!ym) {
      setError("対象月が不正です。");
      return;
    }

    if (!categoryId) {
      setError("カテゴリを選択してください。");
      return;
    }

    const value = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(value) || value < 0) {
      setError("金額は 0 以上の数値で入力してください。");
      return;
    }

    setPosting(true);
    setError(null);

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          month: ym,
          category_id: categoryId,
          amount_int: value,
        }),
      });

      const json: ApiResult<any> = await res.json();

      if (!json.ok) {
        throw new Error(json.error ?? "保存に失敗しました。");
      }

      // 成功したら金額だけクリアして一覧をリロード
      setAmount("");
      if (onSaved) onSaved();
    } catch (e: any) {
      console.error("[BudgetForm] submit error", e);
      setError(e?.message ?? "保存中にエラーが発生しました。");
    } finally {
      setPosting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border bg-background/40 p-4 text-sm"
    >
      <div className="text-sm font-medium">予算を追加 / 更新</div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        同じカテゴリに再度登録すると、金額が上書きされます。
      </p>

      {error && (
        <div className="text-xs text-red-500">エラー：{error}</div>
      )}

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-xs text-muted-foreground sm:w-16">
            種別
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "expense" | "income")}
            className="w-full max-w-xs rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="expense">支出</option>
            <option value="income">収入</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-xs text-muted-foreground sm:w-16">
            カテゴリ
          </span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full flex-1 rounded-md border bg-background px-2 py-1 text-sm"
            disabled={loadingCats}
          >
            {loadingCats && <option>読み込み中…</option>}
            {!loadingCats && categories.length === 0 && (
              <option>カテゴリがありません</option>
            )}
            {!loadingCats &&
              categories.length > 0 &&
              categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-xs text-muted-foreground sm:w-16">
            金額
          </span>
          <div className="flex w-full items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={100}
              className="w-full flex-1 rounded-md border bg-background px-2 py-1 text-sm tabular-nums"
              placeholder="30000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">円</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        disabled={posting}
      >
        {posting ? "保存中…" : "この内容で保存"}
      </button>
    </form>
  );
}

