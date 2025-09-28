// components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthStatus from "@/components/AuthStatus";

type Nav = { label: string; href: string; exact?: boolean };

const NAVS: Nav[] = [
  { label: "ダッシュボード", href: "/dashboard" },
  { label: "記録",         href: "/log", exact: true },
  { label: "予算",         href: "/budgets", exact: true },
  { label: "学ぶ",         href: "/learn" },
  { label: "シミュ",       href: "/sim" },
  { label: "目標",         href: "/goal", exact: true },
  { label: "設定",         href: "/settings", exact: true },
];

function isActive(pathname: string, item: Nav) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-800/60">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
        {/* Brand */}
        <Link href="/" className="font-semibold tracking-wide">
          FinLit PWA
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {NAVS.map((n) => {
            const active = isActive(pathname, n);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={[
                  "px-3 py-1.5 rounded-md text-sm transition",
                  active
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100",
                ].join(" ")}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Auth */}
        <div className="ml-auto">
          <AuthStatus />
        </div>
      </div>

      {/* Mobile bottom nav (optional, simple) */}
      <nav className="md:hidden grid grid-cols-4 gap-px bg-zinc-800/60">
        {NAVS.slice(0, 4).map((n) => {
          const active = isActive(pathname, n);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={[
                "py-2 text-center text-sm",
                active ? "bg-zinc-800 text-zinc-100" : "bg-zinc-900 text-zinc-300",
              ].join(" ")}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

