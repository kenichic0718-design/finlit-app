// app/_utils/validators.ts
export function parsePositiveInt(v: string): number | null {
  if (!v?.trim()) return null;
  if (!/^\d+$/.test(v.trim())) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function requireId(v: string | number | null | undefined): number | null {
  const n = typeof v === "string" ? Number(v) : v ?? null;
  if (n === null || !Number.isFinite(n) || n! <= 0) return null;
  return Number(n);
}

export function parseIsoDate(v: string): string | null {
  // input[type=date] / month いずれも ISO 断定チェックを緩めに（API側で更に厳密化）
  if (!v?.trim()) return null;
  return v;
}

