export function toYYYYMM(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export function monthRange(base: Date) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}
export function monthLabels(base: Date) {
  const days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => `${i + 1}日`);
}
