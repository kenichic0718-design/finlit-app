'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { fromMonthParam, toYYYYMM } from '@/lib/date';
import { useMemo } from 'react';

export default function MonthPicker({ basePath }: { basePath: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const month = sp.get('month') ?? '';
  const value = useMemo(() => {
    const d = fromMonthParam(month);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, [month]);

  return (
    <input
      type="month"
      className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1"
      value={value}
      onChange={(e) => {
        const d = new Date(e.target.value + '-01');
        const yyyymm = toYYYYMM(d);
        const url = `${basePath}?month=${d.getFullYear()}-${String(
          d.getMonth() + 1,
        ).padStart(2, '0')}`;
        // ついでに yyyymm も使うページ向け
        router.push(url + `&yyyymm=${yyyymm}`);
      }}
    />
  );
}

