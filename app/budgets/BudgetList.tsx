// app/budgets/BudgetList.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  ym: string; // YYYY-MM
};

type Category = {
  id: string;
  name: string | null;
  kind: "expense" | "income";
  position?: number | null;
  is_active?: boolean | null;
};

type ApiCategoriesResponse = {
  ok: boolean;
  items?: Category[];
  error?: string;
  detail?: string;
};

type ApiBudgetItem = {
  id: number | string;
  month: string;
  category_id: string | null;
  amount_int: number;
  kind: "expense" | "income" | null;
  category_name: string | null;
};

type ApiBudgetsResponse = {
  ok: boolean;
  items?: ApiBudgetItem[];
  error?: string;
  detail?: string;
};

type Row = {
  key: string; // kind + category_id
  categoryId: string;
  categoryName: string;
  kind: "expense" | "income";
  amountInt: number;
};

function formatAmount(amount: number): string {
  return amount.toLocaleString("ja-JP");
}

/**
 * 予算一覧 + インライン編集
 *
 * - /api/categories でカテゴリ一覧（並び順付き）を取得
 * - /api/budgets?ym=YYYY-MM で当月の予算を取得
 * - カテゴリごとに 1 行ずつ表示し、セルをタップして金額を直接編集
 */
export default function BudgetList({ ym }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ym) return;
    setLoading(true);
    setError(null);

    try {
      const [catsRes, budgetsRes] = await Promise.all([
        fetch("/api/categories", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`/api/budgets?ym=${encodeURIComponent(ym)}`, {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const catsJson = (await catsRes.json()) as ApiCategoriesResponse;
      const budgetsJson = (await budgetsRes.json()) as ApiBudgetsResponse;

      if (!catsJson.ok) {
        throw new Error(catsJson.error || "カテゴリの取得に失敗しました。");
      }
      if (!budgetsJson.ok) {
        throw new Error(budgetsJson.error || "予算の取得に失敗しました。");
      }

      const categories = (catsJson.items ?? []).filter(
        (c): c is Category =>
          !!c &&
          typeof c.id === "string" &&
          (c.kind === "expense" || c.kind === "income") &&
          // is_active が false のカテゴリは予算一覧から除外
          (c.is_active ?? true)
      );

      const budgets = budgetsJson.items ?? [];

      const budgetMap = new Map<string, ApiBudgetItem>();
      for (const b of budgets) {
        if (!b.category_id || !b.kind) continue;
        budgetMap.set(b.category_id, b);
      }

      const nextRows: Row[] = [];

      for (const c of categories) {
        const b = budgetMap.get(c.id);
        const amountInt = b ? Number(b.amount_int ?? 0) : 0;
        nextRows.push({
          key: `${c.kind}:${c.id}`,
          categoryId: c.id,
          categoryName: c.name ?? "（名称未設定）",
          kind: c.kind,
          amountInt: Number.isFinite(amountInt) ? amountInt : 0,
        });
      }

      setRows(nextRows);
    } catch (e: any) {
      console.error("[BudgetList] load error", e);
      setError(e?.message || "予算の取得中にエラーが発生しました。");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [ym]);

  useEffect(() => {
    load();
  }, [load]);

  const expenseRows = useMemo(
    () => rows.filter((r) => r.kind === "expense"),
    [rows]
  );
  const incomeRows = useMemo(
    () => rows.filter((r) => r.kind === "income"),
    [rows]
  );

  const totalExpense = useMemo(
    () => expenseRows.reduce((sum, r) => sum + r.amountInt, 0),
    [expenseRows]
  );
  const totalIncome = useMemo(
    () => incomeRows.reduce((sum, r) => sum + r.amountInt, 0),
    [incomeRows]
  );

  const handleCellClick = (row: Row) => {
    setEditingKey(row.key);
    setEditingValue(row.amountInt.toString());
  };

  const handleInputChange = (value: string) => {
    setEditingValue(value);
  };

  const handleSave = async (row: Row) => {
    const trimmed = editingValue.trim();
    const value = Number(trimmed || "0");
    if (!Number.isFinite(value) || value < 0) {
      alert("0以上の数値を入力してください。");
      return;
    }

    setSavingKey(row.key);

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          month: ym,
          category_id: row.categoryId,
          amount_int: value,
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as
          | { error?: string; detail?: string }
          | null;
        const msg =
          json?.error || json?.detail || "予算の保存に失敗しました。";
        throw new Error(msg);
      }

      setRows((prev) =>
        prev.map((r) =>
          r.key === row.key
            ? {
                ...r,
                amountInt: value,
              }
            : r
        )
      );
      setEditingKey(null);
      setEditingValue("");
    } catch (e: any) {
      console.error("[BudgetList] save error", e);
      alert(e?.message || "予算の保存に失敗しました。");
    } finally {
      setSavingKey(null);
    }
  };

  const renderTable = (kind: "expense" | "income", list: Row[]) => {
    const total = kind === "expense" ? totalExpense : totalIncome;
    const title = kind === "expense" ? "支出カテゴリの予算" : "収入カテゴリの目標";

    return (
      <section className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="min-w-full table-fixed border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="w-1/2 px-3 py-2 text-left font-medium">
                  カテゴリ
                </th>
                <th className="w-1/2 px-3 py-2 text-right font-medium">
                  予算金額
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => {
                const isEditing = editingKey === row.key;
                const isSaving = savingKey === row.key;
                return (
                  <tr key={row.key} className="border-b last:border-none">
                    <td className="px-3 py-2">{row.categoryName}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={100}
                          className="w-24 rounded border bg-background px-2 py-1 text-right text-xs sm:text-sm"
                          value={editingValue}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onBlur={() => handleSave(row)}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          className="inline-flex min-w-[5rem] justify-end text-right"
                          onClick={() => handleCellClick(row)}
                          disabled={isSaving}
                        >
                          {formatAmount(row.amountInt)}円
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/60">
                <td className="px-3 py-2 text-right font-semibold">合計：</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {formatAmount(total)}円
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    );
  };

  if (loading && rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        読み込み中...
      </p>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        カテゴリがありません。設定ページからカテゴリを追加してください。
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {renderTable("expense", expenseRows)}
      {renderTable("income", incomeRows)}
    </div>
  );
}

