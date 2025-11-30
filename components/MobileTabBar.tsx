'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { href: string; label: string; emoji: string };

const items: Item[] = [
  { href: '/dashboard', label: 'ホーム', emoji: '🏠' },
  { href: '/logs',      label: '記録',   emoji: '✍️' },
  { href: '/budgets',   label: '予算',   emoji: '🧮' },
  { href: '/sim',       label: 'シミュ', emoji: '🧪' },
  { href: '/settings',  label: '設定',   emoji: '⚙️' },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const seg = '/' + (pathname?.split('/')[1] ?? '');

  return (
    <nav
      aria-label="クイックナビ"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60 md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = it.href === seg;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={[
                  'flex h-14 flex-col items-center justify-center text-xs',
                  active ? 'text-white' : 'text-white/70 hover:text-white',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                <span className="text-base leading-none">{it.emoji}</span>
                <span className="mt-0.5">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

