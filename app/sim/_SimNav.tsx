// app/sim/_SimNav.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

type Item = { href: string; label: string; desc?: string };

const items: Item[] = [
  { href: "/sim/loan", label: "奨学金返済", desc: "返済負担を概算" },
  { href: "/sim/budget", label: "生活費バランス", desc: "一人暮らし試算" },
];

function isActive(pathname: string, href: string) {
  if (href === "/sim") return pathname === "/sim";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SimNav() {
  const pathname = usePathname();
  const search = useSearchParams()?.toString();
  const qs = useMemo(() => (search ? `?${search}` : ""), [search]);

  return (
    <nav aria-label="シミュレーター内ナビ" className="mb-6">
      {/* モバイル：セレクト */}
      <div className="sm:hidden">
        <label htmlFor="sim-nav" className="sr-only">
          ページを選択
        </label>
        <select
          id="sim-nav"
          className="w-full rounded-md bg-panel px-3 py-2 text-sm"
          value={items.find((i) => isActive(pathname, i.href))?.href ?? ""}
          onChange={(e) => {
            const href = e.target.value + qs;
            window.location.assign(href);
          }}
        >
          {items.map((i) => (
            <option key={i.href} value={i.href}>
              {i.label}
            </option>
          ))}
        </select>
      </div>

      {/* デスクトップ：タブ */}
      <ul className="hidden sm:flex gap-2">
        {items.map((i) => {
          const active = isActive(pathname, i.href);
          return (
            <li key={i.href}>
              <Link
                href={i.href + qs}
                className={[
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-panel/80 border border-border text-white"
                    : "bg-panel hover:bg-panel/70 text-ink/80",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <span>{i.label}</span>
                {i.desc ? (
                  <span className="hidden md:inline text-ink/50 text-xs">
                    {i.desc}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 h-px w-full bg-border/60" />
    </nav>
  );
}

