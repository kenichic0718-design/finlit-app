// lib/num.ts
export const toInt = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

/** API レスポンスから金額を安全に取り出す（amount_int 優先） */
export const amountOf = (x: any) =>
  toInt(x?.amount_int ?? x?.amount_value ?? x?.amount ?? 0);

