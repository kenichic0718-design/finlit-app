export const usageColor = (p: number) => {
  if (!Number.isFinite(p)) return 'bg-white/20';
  if (p < 0.5) return 'bg-emerald-500/70';
  if (p < 0.8) return 'bg-amber-500/80';
  return 'bg-rose-500/80';
};

