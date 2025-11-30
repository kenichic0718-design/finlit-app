// app/logs/_PageClient.tsx
"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";

type Kind = "expense" | "income";

type LogItem = {
  id: string;
  categoryId: string;
  amountInt: number;
  memo: string | null;
  occurredOn: string; // "YYYY-MM-DD"
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

// ---------- helpers ----------

function formatCurrency(amount: number): string {
  // 4,600円 のような表示
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

function getDefaultOccurredOnForYm(ym: string): string {
  const today = new Date();
  const todayYm = getTodayYm();
  if (ym === todayYm) {
    return today.toISOString().slice(0, 10);
  }
  // それ以外の月は1日をデフォルトにする
  return `${ym}-01`;
}

function snapToHundred(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n / 100) * 100;
}

// ---------- components ----------

type LogFormProps = {
  ym: string;
  kind: Kind;
  categories: { id: string; name: string }[];
  onSubmitted: () => void;
};

/**
 * 新規記録フォーム
 *
 * - 種別（支出／収入）は親コンポーネント側で管理
 * - 金額は 100 円単位にスナップして登録
 * - カテゴリは「設定ページの並び順」のまま渡される前提
 */
function LogForm({ ym, kind, categories, onSubmitted }: LogFormProps) {
  const [categoryId, setCategoryId] = useState<string>(
    () => categories[0]?.id ?? ""
  );
  const [occurredOn, setOccurredOn] = useState<string>(
    () => getDefaultOccurredOnForYm(ym)
  );
  const [amountInput, setAmountInput] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 月が変わったら日付のデフォルトを更新
  useEffect(() => {
    setOccurredOn(getDefaultOccurredOnForYm(ym));
  }, [ym]);

  // カテゴリリストが変わったとき、存在しない ID が入っていたらリセット
  useEffect(() => {
    if (!categories.find((c) => c.id === categoryId)) {
      setCategoryId(categories[0]?.id ?? "");
    }
  }, [categories, categoryId]);

  const handleBlurAmount = () => {
    if (!amountInput) return;
    const raw = Number(amountInput.replace(/[^\d-]/g, ""));
    if (!Number.isFinite(raw)) {
      setAmountInput("");
      return;
    }
    const snapped = snapToHundred(raw);
    setAmountInput(snapped === 0 ? "" : String(snapped));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!categoryId) {
      setErrorMsg("カテゴリを選択してください。");
      return;
    }
    if (!occurredOn) {
      setErrorMsg("日付を入力してください。");
      return;
    }
    if (!amountInput) {
      setErrorMsg("金額を入力してください。");
      return;
    }

    const raw = Number(amountInput.replace(/[^\d-]/g, ""));
    if (!Number.isFinite(raw)) {
      setErrorMsg("金額の形式が不正です。");
      return;
    }
    const snapped = snapToHundred(raw);
    if (snapped <= 0) {
      setErrorMsg("金額は 100 円以上を入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ym,
          kind,
          categoryId,
          amountInt: snapped,
          occurredOn,
          memo: memo.trim() || null,
        }),
      });

      const json: LogsGetResponseBody | { ok: boolean; [k: string]: any } =
        await res.json();

      if (!res.ok || (json as ApiErrorResponse).ok === false) {
        const message =
          (json as ApiErrorResponse).error ?? "記録の登録に失敗しました。";
        setErrorMsg(message);
        return;
      }

      // 成功したらフォームをリセット
      setAmountInput("");
      setMemo("");
      // 日付はそのまま残す
      onSubmitted();
    } catch (error) {
      console.error(error);
      setErrorMsg("ネットワークエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = categories.length === 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded-xl border border-border bg-background p-3 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">新しい記録を追加</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {kind === "expense" ? "支出" : "収入"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">日付</label>
          <input
            type="date"
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">カテゴリ</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isDisabled}
            className="rounded-md border bg-background px-2 py-1 text-sm disabled:bg-muted"
          >
            {isDisabled ? (
              <option>カテゴリがありません</option>
            ) : (
              categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">金額（100円単位）</label>
          <input
            type="number"
            inputMode="numeric"
            step={100}
            min={0}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            onBlur={handleBlurAmount}
            placeholder="1000"
            className="rounded-md border bg-background px-2 py-1 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">メモ（任意）</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="昼ごはん など"
            className="rounded-md border bg-background px-2 py-1 text-sm"
          />
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500" aria-live="polite">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || isDisabled}
        className="mt-1 w-full rounded-md bg-primary px-3 py-1.5 text-center text-sm font-semibold text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
      >
        {isSubmitting ? "登録中..." : "記録を追加"}
      </button>
    </form>
  );
}

/**
 * 記録ページ クライアント本体
 *
 * - 月切り替え
 * - 支出 / 収入タブ切り替え
 * - 合計（実績 / 予算 / 残り or 不足/超過）
 * - カテゴリ別内訳＋削除
 */
export default function PageClient() {
  const [ym, setYm] = useState<string>(() => getTodayYm());
  const [kind, setKind] = useState<Kind>("expense");

  const [data, setData] = useState<LogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async (nextYm: string, nextKind: Kind) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const params = new URLSearchParams({
        ym: nextYm,
        kind: nextKind,
      });

      const res = await fetch(`/api/logs?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json: LogsGetResponseBody = await res.json();

      if (!res.ok || json.ok === false) {
        const message =
          (json as ApiErrorResponse).error ?? "記録の取得に失敗しました。";
        setErrorMsg(message);
        setData(null);
        return;
      }

      setData(json as LogsResponse);
    } catch (error) {
      console.error(error);
      setErrorMsg("ネットワークエラーが発生しました。");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    load(ym, kind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeYm = (diffMonths: number) => {
    const nextYm = shiftYm(ym, diffMonths);
    setYm(nextYm);
    load(nextYm, kind);
  };

  const handleChangeKind = (nextKind: Kind) => {
    if (nextKind === kind) return;
    setKind(nextKind);
    load(ym, nextKind);
  };

  const handleRefresh = () => {
    load(ym, kind);
  };

  const categoriesForForm = useMemo(
    () =>
      (data?.categories ?? []).map((c) => ({
        id: c.categoryId,
        name: c.categoryName,
      })),
    [data]
  );

  const handleDeleteLog = async (logId: string) => {
    if (!logId) return;
    const ok = window.confirm("この記録を削除しますか？");
    if (!ok) return;

    setDeletingId(logId);
    try {
      const res = await fetch("/api/logs", {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: logId }),
      });

      const json: ApiErrorResponse | { ok: boolean; [k: string]: any } =
        await res.json();

      if (!res.ok || (json as ApiErrorResponse).ok === false) {
        const message =
          (json as ApiErrorResponse).error ?? "削除に失敗しました。";
        setErrorMsg(message);
        return;
      }

      // 再取得
      load(ym, kind);
    } catch (error) {
      console.error(error);
      setErrorMsg("削除中にエラーが発生しました。");
    } finally {
      setDeletingId(null);
    }
  };

  const summary = data?.summary;
  const totalActual = summary?.totalAmountInt ?? 0;
  const totalBudget = summary?.budgetTotalAmountInt ?? 0;
  const diff = summary?.diffAmountInt ?? totalBudget - totalActual;

  // 3列目のラベル・値・色を kind ごとに分岐
  let thirdLabel = "";
  let thirdAmount = 0;
  let thirdClass = "";

  if (kind === "expense") {
    // 支出: 残り = 予算 - 実績
    thirdLabel = "残り";
    thirdAmount = diff;
    thirdClass = diff >= 0 ? "text-emerald-600" : "text-red-600";
  } else {
    // 収入: 不足 or 超過
    if (diff >= 0) {
      // まだ目標に届いていない
      thirdLabel = "不足";
      thirdAmount = diff;
      thirdClass = "text-red-600";
    } else {
      // 目標を超えている
      thirdLabel = "超過";
      thirdAmount = -diff; // 絶対値表示
      thirdClass = "text-emerald-600";
    }
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">記録</h1>

        {/* 月切り替え */}
        <div className="flex items-center justify-between rounded-2xl bg-card px-3 py-2 shadow-sm">
          <button
            type="button"
            onClick={() => handleChangeYm(-1)}
            className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            ＜
          </button>
          <div className="text-sm font-medium">{ymToLabel(ym)}</div>
          <button
            type="button"
            onClick={() => handleChangeYm(1)}
            className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            ＞
          </button>
        </div>

        {/* kind 切り替え */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card p-1 shadow-sm">
          <button
            type="button"
            onClick={() => handleChangeKind("expense")}
            className={`rounded-xl px-2 py-1.5 text-center text-xs font-semibold ${
              kind === "expense"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground"
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => handleChangeKind("income")}
            className={`rounded-xl px-2 py-1.5 text-center text-xs font-semibold ${
              kind === "income"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground"
            }`}
          >
            収入
          </button>
        </div>
      </header>

      {/* 合計サマリ */}
      <section className="rounded-2xl bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>今月の{kind === "expense" ? "支出" : "収入"}</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-full px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
          >
            再読込
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground">実績</span>
            <span className="text-sm font-semibold">
              {formatCurrency(totalActual)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground">
              {kind === "expense" ? "予算" : "目標"}
            </span>
            <span className="text-sm font-semibold">
              {formatCurrency(totalBudget)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground">
              {thirdLabel}
            </span>
            <span className={`text-sm font-semibold ${thirdClass}`}>
              {formatCurrency(thirdAmount)}
            </span>
          </div>
        </div>
      </section>

      {/* 追加フォーム */}
      <LogForm
        ym={ym}
        kind={kind}
        categories={categoriesForForm}
        onSubmitted={handleRefresh}
      />

      {/* エラー表示 */}
      {errorMsg && (
        <p className="text-xs text-red-500" aria-live="polite">
          {errorMsg}
        </p>
      )}

      {/* 一覧 */}
      <section className="space-y-3 pb-8">
        {isLoading && (
          <div className="rounded-xl bg-card p-3 text-sm text-muted-foreground shadow-sm">
            取得中...
          </div>
        )}

        {!isLoading && data && data.categories.length === 0 && (
          <div className="rounded-xl bg-card p-3 text-sm text-muted-foreground shadow-sm">
            {kind === "expense"
              ? "支出カテゴリがまだありません。設定ページからカテゴリを追加してください。"
              : "収入カテゴリがまだありません。設定ページからカテゴリを追加してください。"}
          </div>
        )}

        {!isLoading &&
          data &&
          data.categories.map((cat) => (
            <div
              key={cat.categoryId}
              className="space-y-2 rounded-2xl bg-card p-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    {cat.categoryName}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    合計 {formatCurrency(cat.totalAmountInt)}
                  </span>
                </div>
              </div>

              {cat.logs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  このカテゴリの記録はまだありません。
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {cat.logs.map((log) => (
                    <li
                      key={log.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-muted px-2 py-1.5"
                    >
                      <div className="flex flex-1 flex-col gap-0.5">
                        <div className="flex items-center justify_between gap-2">
                          <span className="text-[11px] text-muted-foreground">
                            {log.occurredOn}
                          </span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(log.amountInt)}
                          </span>
                        </div>
                        {log.memo && (
                          <span className="truncate text-[11px] text-muted-foreground">
                            {log.memo}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        disabled={deletingId === log.id}
                        className="shrink-0 rounded-full px-2 py-0.5 text-[11px] text-red-500 hover:bg-red-50 disabled:text-muted-foreground disabled:hover:bg-transparent"
                      >
                        {deletingId === log.id ? "削除中…" : "削除"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
      </section>
    </div>
  );
}

