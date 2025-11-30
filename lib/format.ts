// lib/format.ts
export const yen = (n: number | null | undefined) =>
  (Math.round(n ?? 0)).toLocaleString('ja-JP') + '円';

export const percent = (n: number) =>
  `${Number.isFinite(n) ? Math.round(n) : 0}%`;

export const parseYen = (s: string) => {
  const v = Number(String(s).replace(/[^\d.-]/g, ''));
  return Number.isFinite(v) ? v : 0;
};

export const safeDiv = (num: number, den: number) =>
  den <= 0 ? 0 : (num / den) * 100;

export const ymLabel = (d: Date) =>
  `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;

