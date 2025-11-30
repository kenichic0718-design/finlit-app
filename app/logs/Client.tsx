// app/logs/Client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { sumByKind, toNumber, yen, ym as ymNow } from "@/lib/finance";

// ==== types ====
type Log = {
  id: string;
  kind: "expense" | "income";
  amount?: number | string | null;
  amount_int?: number | string | null;
  occurred_at?: string | null;
  created_at?: string | null;
  category_id?: string | null;
  note?: string | null;
};

type Budget = {
  id: string;
  kind: "expense" | "income";
  amount?: number | string | null;
  amount_int?: number | string | null;
  month?: string | null;
  category_id?: string | null;
};

type Category = {
  id: string;
  kind?: "expense" | "income";
  name?: string | null;
  label?: string | null;
  order?: number | null;
};

type Api<T> = {
  ok: boolean;
  items?: T[];
  error?: string;
  detail?: string;
};

// ==== utils ====
function thisYM() {
  return ymNow();
}
const bust = () => `_t=${Date.now()}`;

async function j<T>(url: string): Promise<Api<T>> {
  const r = await fetch(url, {
    credentials: "include",
    headers: { "cache-control": "no-store" },
  });
  return r.json();
}

function toISODate(d: string) {
  // 入力は "YYYY-MM-DD" 前提
  return new Date(d + "T00:00:00.000Z").toISOString();
}

// ==== page ====
export default function LogsPage() {
  const [month, setMonth] = useState(thisYM());

  // サーバ確定データだけを持つ
  const [logs, setLogs] = useState<Log[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [cats, setCats] = useState<Category[]>([]);

  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 入力
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // カテゴリ名マップ
  const catName = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cats) {
      m.set(c.id, String(c.name ?? c.label ?? c.id));
    }
    return m;
  }, [cats]);

  // 合計など（サーバから来た logs だけを使う）
  const expenseUsed = useMemo(
    () => sumByKind(logs, "expense"),
    [logs]
  );
  const incomeUsed = useMemo(
    () => sumByKind(logs, "income"),
    [logs]
  );
  const expenseTarget = useMemo(
    () => sumByKind(budgets, "expense"),
    [budgets]
  );
  const incomeTarget = useMemo(
    () => sumByKind(budgets, "income"),
    [budgets]
  );

  // カテゴリ別内訳（当月・支出）
  const groupedByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const x of logs) {
      if (x.kind !== "expense") continue;
      const key = x.category_id
        ? catName.get(x.category_id) ?? x.category_id
        : "（未分類）";
      const val = map.get(key) ?? 0;
      const n = Number(x.amount ?? x.amount_int ?? 0);
      map.set(key, val + (Number.isFinite(n) ? n : 0));
    }
    return Array.from(map.entries())
      .map(([k, v]) => ({ category: k, total: v }))
      .sort((a, b) => b.total - a.total);
  }, [logs, catName]);

  // サーバから再取得
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [l, b, c] = await Promise.all([
        j<Log>(`/api/logs?ym=${month}&${bust()}`),
        j<Budget>(`/api/budgets?ym=${month}&${bust()}`),
        j<Category>(`/api/categories?kind=${kind}&${bust()}`),
      ]);
      if (!l.ok) throw new Error(l.error || "logs failed");
      if (!b.ok) throw new Error(b.error || "budgets failed");
      if (!c.ok) throw new Error(c.error || "categories failed");

      setLogs(l.items ?? []);
      setBudgets(b.items ?? []);
      setCats(c.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? "failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, kind]);

  // 送信：サーバ確定値だけを信用し、POST 成功後に load() し直す
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (posting) return;

    const amt = toNumber(amount);
    const occurredISO = date ? toISODate(date) : undefined;

    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/logs?${bust()}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
        body: JSON.stringify({
          amount: amt,
          kind,
          note: note || undefined,
          category_id: categoryId || undefined,
          occurred_at: occurredISO,
        }),
      });
      const json: Api<Log> = await res.json();
      if (!json.ok) {
        throw new Error(json.error || "post failed");
      }

      // 入力クリア & 再取得
      setAmount("");
      setNote("");
      load();
    } catch (e: any) {
      setError(e?.message ?? "post error");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-xl font-semibold">記録</h1>

      {/* 月セレクタ */}
      <section className="rounded-2xl border p-4 space-y-2">
        <div className="text-sm font-medium">年月</div>
        <div className="flex">
          <input
            id="month-input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </section>

      {/* サマリ */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border p-4 space-y-2">
          <div className="text-sm text-muted-foreground">
            今月の合計（記録）
          </div>
          <div className="text-sm sm:text-base leading-relaxed">
            支出：{yen(expenseUsed)}
            <br />
            収入：{yen(incomeUsed)}
          </div>
        </div>
        <div className="rounded-2xl border p-4 space-y-2">
          <div className="text-sm text-muted-foreground">
            今月の目標（予算）
          </div>
          <div className="text-sm sm:text-base leading-relaxed">
            支出枠：{yen(expenseTarget)}
            <br />
            収入目標：{yen(incomeTarget)}
          </div>
        </div>
        <div className="rounded-2xl border p-4 space-y-2">
          <div className="text-sm text-muted-foreground">差分</div>
          <div className="text-sm sm:text-base leading-relaxed">
            支出 残り：
            {yen(Math.max(0, expenseTarget - expenseUsed))}
            <br />
            収入 進捗：
            {incomeTarget
              ? Math.round((incomeUsed / incomeTarget) * 100)
              : 0}
            %
          </div>
        </div>
      </div>

      {/* 入力フォーム */}
      <form
        onSubmit={submit}
        className="rounded-2xl border p-4 space-y-4"
      >
        <div className="text-sm font-medium">新規記録</div>
        {error && (
          <div className="text-sm text-red-500">
            エラー：{String(error)}
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-5">
          {/* 種別 */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 lg:col-span-1">
            <label className="text-sm sm:w-16">種別</label>
            <select
              className="w-full rounded-md border bg-background px-2 py-2 text-sm"
              value={kind}
              onChange={(e) =>
                setKind(e.target.value as "expense" | "income")
              }
            >
              <option value="expense">支出</option>
              <option value="income">収入</option>
            </select>
          </div>

          {/* 日付 */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 lg:col-span-1">
            <label className="text-sm sm:w-16">日付</label>
            <input
              type="date"
              className="w-full rounded-md border bg-background px-2 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* カテゴリ */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 lg:col-span-2">
            <label className="text-sm sm:w-16">カテゴリ</label>
            <select
              className="w-full rounded-md border bg-background px-2 py-2 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">（未分類）</option>
              {cats
                .filter((c) => !c.kind || c.kind === kind)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name ?? c.label ?? c.id}
                  </option>
                ))}
            </select>
          </div>

          {/* 金額 */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 lg:col-span-1">
            <label className="text-sm sm:w-20">金額(円)</label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="1500"
              className="w-full rounded-md border bg-background px-2 py-2 text-sm tabular-nums"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value.replace(/[^\d]/g, ""))
              }
            />
          </div>

          {/* メモ ＋ ボタン */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <label className="text-sm">メモ</label>
            <input
              className="w-full rounded-md border bg-background px-2 py-2 text-sm"
              placeholder="任意"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              type="submit"
              className="w-full sm:w-auto sm:self-end rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              disabled={posting}
            >
              {posting ? "送信中…" : "記録する"}
            </button>
          </div>
        </div>
      </form>

      {/* カテゴリ別内訳（当月・支出） */}
      <section className="space-y-2">
        <h2 className="text-base font-medium">
          カテゴリ別内訳（当月・支出）
        </h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">
            読み込み中…
          </div>
        ) : groupedByCategory.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            今月の記録はまだありません。
          </div>
        ) : (
          <ul className="space-y-2">
            {groupedByCategory.map((g) => (
              <li
                key={g.category}
                className="flex items-center justify-between rounded-xl border p-3 text-sm sm:text-base"
              >
                <span>{g.category}</span>
                <span className="tabular-nums">
                  {yen(g.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

