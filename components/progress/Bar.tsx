'use client';
import { percent } from '@/lib/format';
import { usageColor } from '@/lib/progressColor';

export default function ProgressBar({
  value,              // 0..1 を想定（呼び出し側で ratio などで安全化推奨）
  height = 'h-2',
  showText = false,
  className = '',
}: {
  value: number;
  height?: string;
  showText?: boolean;
  className?: string;
}) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const width = `${(v * 100).toFixed(0)}%`;

  return (
    <div className={`w-full rounded bg-white/10 ${height} overflow-hidden ${className}`}>
      <div
        className={`h-full ${usageColor(v)} transition-[width] duration-300 ease-out`}
        style={{ width }}
        aria-label={`進捗 ${percent(v)}`}
      />
      {showText && (
        <div className="mt-1 text-xs text-white/70">{percent(v)}</div>
      )}
    </div>
  );
}

