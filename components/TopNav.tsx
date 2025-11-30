// components/TopNav.tsx
import Link from 'next/link';

const items = [
  { href: '/', label: 'ダッシュボード' },
  { href: '/logs', label: '記録' },
  { href: '/budgets', label: '予算' },
  { href: '/learn', label: '学習' },
  { href: '/sim', label: 'シミュ' },
  // { href: '/goals', label: '目標' }, // ← 目標ページは今回のプロトタイプでは非表示
  { href: '/settings', label: '設定' }
];

export default function TopNav() {
  return (
    <nav className="px-4 py-3 border-b border-neutral-800">
      <div className="flex gap-4 flex-wrap">
        <Link className="font-semibold no-underline" href="/">FinLit PWA</Link>
        {items.map(i => (
          <Link key={i.href} className="no-underline hover:underline" href={i.href}>{i.label}</Link>
        ))}
      </div>
    </nav>
  );
}

