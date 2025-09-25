"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

/**
 * ヘッダー右側のナビゲーション。
 * - アクティブなリンクを太字＋下線で表示
 * - スマホでも折り返して使えるシンプルなフレックス
 * - 右端に「設定 ⚙︎」を明示
 */
export default function Nav() {
  const pathname = usePathname();

  // 左側の主要リンク
  const links = useMemo(
    () => [
      { href: "/dashboard", label: "ダッシュボード" },
      { href: "/log", label: "記録" },
      { href: "/budgets", label: "予算" },
      { href: "/learn", label: "学ぶ" },
      { href: "/goal", label: "目標" },
    ],
    []
  );

  // アクティブ判定（完全一致 or 先頭一致のゆるめ判定にしたい場合は startsWith へ）
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="w-full">
      <div className="flex items-center justify-end gap-4 text-sm">
        {/* 左側リンク群 */}
        <div className="flex items-center gap-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={[
                "px-2 py-1 rounded-md transition-colors",
                isActive(l.href)
                  ? "font-semibold underline underline-offset-4"
                  : "text-muted hover:text-ink hover:bg-panel/60",
              ].join(" ")}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* 仕切り（薄い縦線） */}
        <span className="h-5 w-px bg-line/70 mx-1" aria-hidden />

        {/* 右端：設定 */}
        <Link
          href="/settings"
          className={[
            "px-2 py-1 rounded-md transition-colors flex items-center gap-1",
            isActive("/settings")
              ? "font-semibold underline underline-offset-4"
              : "text-muted hover:text-ink hover:bg-panel/60",
          ].join(" ")}
          aria-label="設定"
        >
          <span className="text-base" aria-hidden>⚙︎</span>
          <span>設定</span>
        </Link>
      </div>
    </nav>
  );
}

