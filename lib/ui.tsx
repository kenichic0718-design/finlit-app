'use client';
import { useEffect, useState } from 'react';

export const SkeletonBar: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse rounded bg-white/10 h-3 ${className ?? ''}`} />
);

// ページ共通の”微トースト”（既存に被らない最小）
export const useMiniToast = () => {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 1600);
    return () => clearTimeout(t);
  }, [msg]);
  const Toast = msg ? (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-black/80 px-3 py-2 text-sm text-white shadow">
      {msg}
    </div>
  ) : null;
  return { toast: (m: string) => setMsg(m), Toast };
};

