export const CANONICAL_CATEGORIES = [
  "食費",
  "娯楽",
  "交通",
  "日用品",
  "通信",
  "その他",
] as const;

export type CanonicalCategory = typeof CANONICAL_CATEGORIES[number];

/** 同義語 → 正規カテゴリ のマップ（既存データのブレを吸収） */
export const CATEGORY_SYNONYM_MAP: Record<string, CanonicalCategory> = {
  "ごはん": "食費",
  "米": "食費",
  "めし": "食費",
  "テスト食費": "食費",
};

/** 正規化（該当がなければ元を返す） */
export function normalizeCategory(raw: string): string {
  return CATEGORY_SYNONYM_MAP[raw] ?? raw;
}
