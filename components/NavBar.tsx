"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/logs", label: "記録" },
  { href: "/budgets", label: "予算" },
  { href: "/learn", label: "学ぶ" },
  { href: "/sim", label: "シミュ" },
  { href: "/goals", label: "目標" },
  { href: "/settings", label: "設定" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="ml-auto">
      <ul className="flex gap-2">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={clsx(
                  "px-3 py-1 rounded-md text-sm transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-neutral-300 hover:text-white hover:bg-white/5"
                )}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

