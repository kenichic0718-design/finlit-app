// NaN/Infinity を潰しつつ安全に数値化
export const toNum = (v: unknown, def = 0): number => {
  const n = typeof v === 'string' ? Number(v.replace(/[,¥\s]/g, '')) : Number(v);
  return Number.isFinite(n) ? n : def;
};

// 0分母ガード付きの割合
export const ratio = (num: unknown, den: unknown, def = 0): number => {
  const n = toNum(num, 0);
  const d = toNum(den, 0);
  if (d <= 0) return def;
  const r = n / d;
  return Number.isFinite(r) ? r : def;
};

// 合計（undefinedや文字列が混ざってもOK）
export const sum = (arr: unknown[]): number =>
  arr.reduce((a, b) => a + toNum(b, 0), 0);

// 小数桁を安全に丸める
export const toFixedSafe = (v: unknown, d = 0): number => {
  const n = toNum(v, 0);
  const p = 10 ** d;
  return Math.round(n * p) / p;
};

