// app/api/_lib/range.ts
export type MonthRange = { startISO: string; endISO: string; ymText: string };

export function normalizeRangeFromSearch(params: URLSearchParams): MonthRange {
  const toMonthRange = (ymInput: string): MonthRange => {
    const m = (ymInput || "").replace(/[^\d]/g, "");
    if (m.length < 6) throw new Error("bad ym");
    const y = parseInt(m.slice(0, 4), 10);
    const mo = parseInt(m.slice(4, 6), 10) - 1;
    const start = new Date(Date.UTC(y, mo, 1, 0, 0, 0));
    const end = new Date(Date.UTC(y, mo + 1, 1, 0, 0, 0));
    return {
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      ymText: `${y}-${String(mo + 1).padStart(2, "0")}`,
    };
  };

  // 受け付けるフォーマット：ym / month / year+month
  const ym =
    params.get("month") ??
    params.get("month") ??
    (params.get("year") && params.get("month")
      ? `${params.get("year")}-${params.get("month")}`
      : undefined);

  if (ym) return toMonthRange(ym);

  // start&end / date_from&date_to（任意対応）
  const start = params.get("start") ?? params.get("date_from");
  const end = params.get("end") ?? params.get("date_to");
  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) throw new Error("bad range");
    return {
      startISO: s.toISOString(),
      endISO: e.toISOString(),
      ymText: s.toISOString().slice(0, 7),
    };
  }

  // デフォルト：今月
  const now = new Date();
  return toMonthRange(
    `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
  );
}

