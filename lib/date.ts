// lib/date.ts

export function toYYYYMM(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function toYYYY_MM(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthFromQuery(
  q?: string | null
): { yyyymm: string; label: string } {
  if (!q) {
    const now = new Date();
    return { yyyymm: toYYYYMM(now), label: toYYYY_MM(now) };
  }
  // 受け付ける：YYYY-MM / YYYYMM
  const compact = q.includes("-") ? q.replace("-", "") : q;
  const y = compact.slice(0, 4);
  const m = compact.slice(4, 6);
  return { yyyymm: `${y}${m}`, label: `${y}-${m}` };
}

/**
 * MonthPicker 用:
 * - クエリ（YYYY-MM / YYYYMM / 未指定）から、その月の 1日を表す Date を返す
 * - monthFromQuery のロジックを流用しているので挙動は揃っている
 */
export function fromMonthParam(q?: string | null): Date {
  const { yyyymm } = monthFromQuery(q);
  const y = Number(yyyymm.slice(0, 4));
  const m = Number(yyyymm.slice(4, 6));

  // 念のためガード（基本ここには来ない想定）
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return new Date();
  }

  return new Date(y, m - 1, 1);
}

// ==============================
// 旧 API との互換用ヘルパー
// ==============================

export type Ym = {
  year: number;
  month: number; // 1-12
};

/**
 * YYYY-MM / YYYYMM / 未指定 から Ym を返す。
 * 無効値の場合は「今日の年月」にフォールバック。
 */
export function parseYm(value?: string | null): Ym {
  if (!value) {
    return todayYm();
  }

  const compact = value.includes("-") ? value.replace("-", "") : value;
  const y = Number(compact.slice(0, 4));
  const m = Number(compact.slice(4, 6));

  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return todayYm();
  }

  return { year: y, month: m };
}

/** 今日の年月を Ym で返す */
export function todayYm(): Ym {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** Ym から "YYYY-MM" 形式の文字列を返す */
export function ymToString(ym: Ym): string {
  return `${ym.year}-${String(ym.month).padStart(2, "0")}`;
}
