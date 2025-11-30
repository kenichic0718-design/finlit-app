'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type Item = { href: string; label: string; key: string };

const items: Item[] = [
  { href: '/dashboard', label: 'ダッシュボード', key: 'dashboard' },
  { href: '/logs',       label: '記録',           key: 'logs' },
  { href: '/budgets',    label: '予算',           key: 'budgets' },
  { href: '/learn',      label: '学ぶ',           key: 'learn' },
  { href: '/sim',        label: 'シミュ',         key: 'sim' },
  { href: '/goals',      label: '目標',           key: 'goals' },
  { href: '/settings',   label: '設定',           key: 'settings' },
];

export default function AppNav() {
  const pathname = usePathname();

  const current = useMemo(() => {
    // 先頭セグメントで現在地判定（/sim/xxx も /sim と一致）
    const seg = '/' + (pathname?.split('/')[1] ?? '');
    const match = items.find(i => i.href === seg);
    return match?.href ?? null;
  }, [pathname]);

  return (
    <nav
      aria-label="メインナビゲーション"
      className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-surface/70 backdrop-blur supports-[backdrop-filter]:bg-surface/60"
    >
      <div className="mx-auto max-w-6xl px-3">
        <div className="flex h-12 items-center gap-2 overflow-x-auto overscroll-x-contain no-scrollbar">
          {items.map((item) => {
            const active = current === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'shrink-0 rounded-md px-3 py-1.5 text-sm transition',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/5',
                ].join(' ')}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

