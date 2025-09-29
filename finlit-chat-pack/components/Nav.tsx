// components/Nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

const items: Item[] = [
  { href: "/", label: "ダッシュボード" },
  { href: "/log", label: "記録" },
  { href: "/budgets", label: "予算" },
  { href: "/learn", label: "学ぶ" },
  { href: "/sim", label: "シミュ" }, // ← 追加
  { href: "/goal", label: "目標" },
  { href: "/settings", label: "設定" },
];

export default function Nav() {
  const pathname = usePathname() || "/";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="flex items-center gap-3 md:gap-5">
      {items.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={[
              "text-sm transition rounded-lg px-2 py-1",
              active
                ? "bg-white/10 text-ink"
                : "opacity-80 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
            ].join(" ")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
