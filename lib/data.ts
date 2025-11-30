// API 揺れを吸収するユーティリティ（全ページ共通で使用）
export type Kind = 'expense' | 'income';

export type RawLog = {
  id?: string;
  amount?: number | string;
  kind?: Kind;
  category_id?: string | null;
  note?: string | null;
  occurred_at?: string | null; // 正式
  occured_at?: string | null;  // 互換
  date?: string | null;        // 互換
  created_at?: string | null;
};

export type RawBudget = {
  id?: string;
  month?: string | null;       // 'YYYY-MM' or 'YYYY-MM-DD'
  created_at?: string | null;
  kind?: Kind;
  category_id?: string | null;
  amount_value?: number | string | null; // 正式寄り
  amount?: number | string | null;       // 互換
  name?: string | null;
};

// ---- fetch 揺れを吸収 ----
export async function fetchJsonFlexible(url: string, init?: RequestInit) {
  const res = await fetch(url, { cache: 'no-store', ...init });
  // 204 / 空の時でも安全に処理
  let data: any = null;
  try { data = await res.json(); } catch { data = null; }
  // {items: []} / [] / {ok:true, items: []} いずれも配列を返す
  const arr = Array.isArray(data) ? data
            : Array.isArray(data?.items) ? data.items
            : [];
  return arr;
}

export function ymOf(d = new Date()) {
  return d.toISOString().slice(0, 7);
}
export function isInMonth(iso?: string | null, ym?: string) {
  if (!iso || !ym) return false;
  return iso.slice(0, 7) === ym;
}

// ---- 正規化 ----
export type Log = {
  id: string;
  amount: number;
  kind: Kind;
  occurred_at: string | null; // YYYY-MM-DD
  created_at: string | null;
  category_id: string | null;
  note: string | null;
};
export function normalizeLogs(rows: RawLog[]): Log[] {
  return (rows ?? []).map((r, i) => {
    const amt = Number(r.amount ?? 0);
    const occurred =
      r.occurred_at ?? r.occured_at ?? r.date ?? r.created_at ?? null;
    return {
      id: String(r.id ?? `log_${i}`),
      amount: isFinite(amt) ? amt : 0,
      kind: (r.kind === 'income' ? 'income' : 'expense') as Kind,
      occurred_at: occurred,
      created_at: r.created_at ?? occurred ?? null,
      category_id: (r.category_id as any) ?? null,
      note: (r.note as any) ?? null,
    };
  });
}

export type Budget = {
  id: string;
  month: string | null; // YYYY-MM or YYYY-MM-DD
  kind: Kind;
  amount: number;
  category_id: string | null;
  name: string | null;
  created_at: string | null;
};
export function normalizeBudgets(rows: RawBudget[]): Budget[] {
  return (rows ?? []).map((r, i) => {
    const amt = Number(r.amount_value ?? r.amount ?? 0);
    return {
      id: String(r.id ?? `bud_${i}`),
      month: r.month ?? r.created_at ?? null,
      created_at: r.created_at ?? null,
      kind: (r.kind === 'income' ? 'income' : 'expense') as Kind,
      amount: isFinite(amt) ? amt : 0,
      category_id: (r.category_id as any) ?? null,
      name: (r.name as any) ?? null,
    };
  });
}

// 合計
export function sumByKind<T extends { kind: Kind }>(
  rows: T[],
  pickAmount: (x: T) => number
) {
  const s = (k: Kind) =>
    rows.filter((x) => x.kind === k).reduce((a, b) => a + pickAmount(b), 0);
  return { expense: s('expense'), income: s('income') };
}

