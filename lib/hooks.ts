// lib/hooks.ts
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { parseYm, todayYm, ymToString } from './date';

export const useMonthParam = (key = 'month') => {
  const sp = useSearchParams();
  const router = useRouter();
  const current = parseYm(sp.get(key)) ?? todayYm();

  const setMonth = (month: { year: number; month: number }) => {
    const params = new URLSearchParams(sp.toString());
    // ← ここだけ修正：存在しない ym ではなく、引数 month を使う
    params.set(key, ymToString(month));
    router.replace(`?${params.toString()}`);
  };

  return { month: current, setMonth };
};
