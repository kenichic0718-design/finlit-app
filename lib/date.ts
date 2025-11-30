export function toYYYYMM(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}
export function toYYYY_MM(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
export function monthFromQuery(q?: string | null): { yyyymm: string; label: string } {
  if (!q) {
    const now = new Date();
    return { yyyymm: toYYYYMM(now), label: toYYYY_MM(now) };
  }
  // 受け付ける：YYYY-MM / YYYYMM
  const compact = q.includes('-') ? q.replace('-', '') : q;
  const y = compact.slice(0, 4);
  const m = compact.slice(4, 6);
  return { yyyymm: `${y}${m}`, label: `${y}-${m}` };
}

