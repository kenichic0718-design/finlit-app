// app/DashboardClient.tsx
"use client";

import { useEffect, useState } from "react";

type Kind = "expense" | "income";

type LogItem = {
  id: string;
  categoryId: string;
  amountInt: number;
  memo: string | null;
  occurredOn: string;
  createdAt: string;
};

type CategoryLogs = {
  categoryId: string;
  categoryName: string;
  kind: Kind;
  totalAmountInt: number;
  logs: LogItem[];
};

type LogsResponse = {
  ok: true;
  ym: string;
  kind: Kind;
  summary: {
    totalAmountInt: number;
    budgetTotalAmountInt: number;
    diffAmountInt: number; // budgets - actual
  };
  categories: CategoryLogs[];
};

type ApiErrorResponse = {
  ok: false;
  error?: string;
  detail?: unknown;
};

type LogsGetResponseBody = LogsResponse | ApiErrorResponse;

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}

function getTodayYm(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function shiftYm(ym: string, diffMonths: number): string {
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return getTodayYm();
  const d = new Date(y, m - 1 + diffMonths, 1);
  const ny = d.getFullYear();
  const nm = d.getMonth() + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

function ymToLabel(ym: string): string {
  const [yStr, mStr] = ym.split("-");
  if (!yStr || !mStr) return ym;
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return ym;
  return `${y}年${m}月`;
}

/**
 * kind ごとに /api/logs を叩いて summary & categories を取得
 */
async function fetchLogsSummary(
  ym: string,
  kind: Kind
): Promise<LogsResponse | null> {
  const params = new URLSearchParams({ ym, kind });
  const res = await fetch(`/api/logs?${params.toString()}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const json: LogsGetResponseBody = await res.json();
  if (!res.ok || json.ok === false) {
    const message =
      (json as ApiErrorResponse).error ?? "記録の取得に失敗しました。";
    console.error("[Dashboard] fetchLogsSummary error:", message, json);
    return null;
  }

  return json as LogsResponse;
}

export default function DashboardClient() {
  const [ym, setYm] = useState<string>(() => getTodayYm());

  const [expenseData, setExpenseData] = useState<LogsResponse | null>(null);
  const [incomeData, setIncomeData] = useState<LogsResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = async (nextYm: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const [expense, income] = await Promise.all([
        fetchLogsSummary(nextYm, "expense"),
        fetchLogsSummary(nextYm, "income"),
      ]);

      setExpenseData(expense);
      setIncomeData(income);

      if (!expense && !income) {
        setErrorMsg("記録の取得に失敗しました。");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("ネットワークエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(ym);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeYm = (diff: number) => {
    const nextYm = shiftYm(ym, diff);
    setYm(nextYm);
    load(nextYm);
  };

  const handleRefresh = () => {
    load(ym);
  };

  const totalExpense = expenseData?.summary.totalAmountInt ?? 0;
  const budgetExpense = expenseData?.summary.budgetTotalAmountInt ?? 0;
  const diffExpense =
    expenseData?.summary.diffAmountInt ?? budgetExpense - totalExpense;

  const totalIncome = incomeData?.summary.totalAmountInt ?? 0;
  const budgetIncome = incomeData?.summary.budgetTotalAmountInt ?? 0;
  const diffIncomeRaw =
    incomeData?.summary.diffAmountInt ?? budgetIncome - totalIncome;

  // 収入側の3列目（不足 or 超過）
  let incomeStatusLabel = "";
  let incomeStatusValue = 0;
  let incomeStatusClass = "";

  if (diffIncomeRaw >= 0) {
    // まだ目標に届いていない
    incomeStatusLabel = "不足";
    incomeStatusValue = diffIncomeRaw;
    incomeStatusClass = "text-red-600";
  } else {
    // 目標を超えている
    incomeStatusLabel = "超過";
    incomeStatusValue = -diffIncomeRaw;
    incomeStatusClass = "text-emerald-600";
  }

  // カテゴリ TOP3（0円のカテゴリは除外）
  const topExpenseCategories =
    expenseData?.categories
      .filter((c) => c.totalAmountInt > 0)
      .sort((a, b) => b.totalAmountInt - a.totalAmountInt)
      .slice(0, 3) ?? [];

  const topIncomeCategories =
    incomeData?.categories
      .filter((c) => c.totalAmountInt > 0)
      .sort((a, b) => b.totalAmountInt - a.totalAmountInt)
      .slice(0, 3) ?? [];

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 sm:max-w-lg sm:gap-6">
      {/* ヘッダー（対象月） */}
      <header className="space-y-3">
        <h1 className="text-xl font-semibold">ダッシュボード</h1>

        <div className="flex items-center justify-between rounded-2xl bg-card px-3 py-2 shadow-sm sm:px-4">
          <button
            type="button"
            onClick={() => handleChangeYm(-1)}
            className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted active:scale-95 transition"
          >
            ＜
          </button>
          <div className="text-sm font-semibold">{ymToLabel(ym)}</div>
          <button
            type="button"
            onClick={() => handleChangeYm(1)}
            className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted active:scale-95 transition"
          >
            ＞
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>今月のざっくり状況</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-full px-3 py-1 text-[10px] hover:bg-muted"
          >
            再読込
          </button>
        </div>
      </header>

      {/* ローディング／エラー */}
      {isLoading && (
        <p className="text-sm text-muted-foreground">集計中...</p>
      )}
      {errorMsg && !isLoading && (
        <p className="text-xs text-red-500" aria-live="polite">
          {errorMsg}
        </p>
      )}

      {/* サマリカード（支出／収入） */}
      <section className="grid gap-4 sm:gap-5 md:grid-cols-2">
        {/* 支出 */}
        <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">今月の支出</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              記録ページの「支出」と連動
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground">実績</span>
              <span className="text-sm font-semibold">
                {formatCurrency(totalExpense)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground">予算</span>
              <span className="text-sm font-semibold">
                {formatCurrency(budgetExpense)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground">残り</span>
              <span
                className={`text-sm font-semibold ${
                  diffExpense >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {formatCurrency(diffExpense)}
              </span>
            </div>
          </div>

          <div className="mt-1.5 space-y-1">
            <p className="text-[11px] text-muted-foreground">
              よく使っている支出カテゴリ（TOP3）
            </p>
            {topExpenseCategories.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                まだ支出の記録がありません。
              </p>
            ) : (
              <ul className="space-y-1 text-xs">
                {topExpenseCategories.map((c) => (
                  <li
                    key={c.categoryId}
                    className="flex items-center justify-between rounded-xl bg-muted px-3 py-1.5"
                  >
                    <span className="truncate">{c.categoryName}</span>
                    <span className="font-semibold">
                      {formatCurrency(c.totalAmountInt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 収入 */}
        <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">今月の収入</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              記録ページの「収入」と連動
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground">実績</span>
              <span className="text-sm font-semibold">
                {formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground">目標</span>
              <span className="text-sm font-semibold">
                {formatCurrency(budgetIncome)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground">
                {incomeStatusLabel}
              </span>
              <span
                className={`text-sm font-semibold ${incomeStatusClass}`}
              >
                {formatCurrency(incomeStatusValue)}
              </span>
            </div>
          </div>

          <div className="mt-1.5 space-y-1">
            <p className="text-[11px] text-muted-foreground">
              主な収入カテゴリ（TOP3）
            </p>
            {topIncomeCategories.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                まだ収入の記録がありません。
              </p>
            ) : (
              <ul className="space-y-1 text-xs">
                {topIncomeCategories.map((c) => (
                  <li
                    key={c.categoryId}
                    className="flex items-center justify-between rounded-xl bg-muted px-3 py-1.5"
                  >
                    <span className="truncate">{c.categoryName}</span>
                    <span className="font-semibold">
                      {formatCurrency(c.totalAmountInt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 将来の拡張スペース */}
      <section className="space-y-2 rounded-2xl bg-card p-4 text-xs text-muted-foreground shadow-sm">
        <p>
          ダッシュボードは「記録」と「予算」の集計結果をざっくり確認する場所です。
        </p>
        <p>
          使いながら、「ここにこの情報が欲しい」など気づいたことがあればメモしておいて、後で卒論の考察に使えるようにしておくと良いです。
        </p>
      </section>
    </div>
  );
}

