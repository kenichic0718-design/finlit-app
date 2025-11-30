export function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const tone =
    v < 80 ? "bg-emerald-500" : v < 100 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="h-2 w-full rounded bg-white/5 overflow-hidden">
      <div className={`h-full ${tone}`} style={{ width: `${v}%` }} />
    </div>
  );
}

