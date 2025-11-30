// lib/finance.ts

// ---------- 型 ----------
export type LogItem = {
  id?: string;
  amount?: number | string | null;
  amount_int?: number | string | null;
  kind?: 'expense' | 'income';
  occurred_at?: string | null;
  created_at?: string | null;
  // DBに month カラムは無い想定。互換のため残すが使用しない。
  month?: string | null;
  category_id?: string | null;
  note?: string | null;
};

export type BudgetItem = {
  id?: string;
  amount?: number | string | null;
  amount_int?: number | string | null;
  kind?: 'expense' | 'income';
  month?: string | null; // こちらは月カラムがある前提
  category_id?: string | null;
};

// ---------- ユーティリティ ----------
export function toNumber(v: unknown): number {
  const n = Number((v as any) ?? 0);
  return Number.isFinite(n) ? n : 0;
}

// 表示専用
export function yen(n: number): string {
  try {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(n ?? 0);
  } catch {
    return `${Math.round(n ?? 0)}円`;
  }
}

// ym（YYYY-MM）を返す。Date/ISO/undefinedに対応
// 後方互換の alias として toYM を export する
export function ym(input?: Date | string | null): string {
  if (!input) return new Date().toISOString().slice(0, 7);
  if (input instanceof Date) return input.toISOString().slice(0, 7);
  if (typeof input === 'string') {
    if (/^\d{4}-\d{2}$/.test(input)) return input;
    const d = new Date(input);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 7);
  }
  return new Date().toISOString().slice(0, 7);
}
export { ym as toYM };

// レコード or ISO文字列 or Date から ym を取る（既存画面が使用）
export function ymOf(src?: any): string {
  if (src instanceof Date || typeof src === 'string' || src == null) {
    return ym(src as any);
  }
  // record想定：snake/camel どちらも許容
  const dateLike =
    src?.occurred_at ??
    src?.created_at ??
    src?.occurredAt ??
    src?.createdAt ??
    null;
  return ym(dateLike);
}

// 月→UTC範囲 [from, to) を返す（to は翌月1日0時）
export function ymToRange(month: string): { fromISO: string; toISO: string } {
  const m = /^\d{4}-\d{2}$/.test(month) ? month : ym(month);
  const [y, mm] = m.split('-').map((s) => Number(s));
  const from = new Date(Date.UTC(y, mm - 1, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(y, mm, 1, 0, 0, 0, 0)); // 翌月
  return { fromISO: from.toISOString(), toISO: to.toISOString() };
}

// ---------- 配列整形 ----------
export function normalizeItems(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

// 既存コード互換のラッパー
export const normalizeLogs = (res: any): LogItem[] =>
  normalizeItems(res) as LogItem[];
export const normalizeBudgets = (res: any): BudgetItem[] =>
  normalizeItems(res) as BudgetItem[];

// ---------- 集計 ----------
export function sumByKind(
  items: Array<LogItem | BudgetItem> | undefined | null,
  kind: 'expense' | 'income'
): number {
  const arr = Array.isArray(items) ? items : [];
  return arr
    .filter((x) => x?.kind === kind)
    .reduce((s, x: any) => s + toNumber(x?.amount ?? x?.amount_int), 0);
}

export function sumAmount(
  items: Array<LogItem | BudgetItem> | undefined | null
): number {
  const arr = Array.isArray(items) ? items : [];
  return arr.reduce((s, x: any) => s + toNumber(x?.amount ?? x?.amount_int), 0);
}

export function progress(used: number, target: number): number {
  if (!target || target <= 0) return 0;
  const p = (used / target) * 100;
  return Math.max(0, Math.min(100, Math.round(p)));
}

// ---------- fetch ヘルパー（既存ページが使用） ----------
export async function fetchJson(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<any> {
  const res = await fetch(input as any, { credentials: 'include', ...(init ?? {}) });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  // ここでは HTTP ステータスではなく JSON の ok を見る前提に揃える
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || res.statusText;
    const err = new Error(msg);
    (err as any).status = res.status;
    throw err;
  }
  return data ?? {};
}

