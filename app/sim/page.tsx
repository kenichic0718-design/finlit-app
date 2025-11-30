// app/sim/page.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "@/lib/telemetry";

const items = [
  {
    href: "/sim/loan",
    title: "奨学金返済シミュレーター",
    desc: "借入額・利率・返済期間と、想定手取り月収から、毎月の返済額と返済負担率を概算します。",
  },
  {
    href: "/sim/budget",
    title: "生活費バランスシミュレーター",
    desc: "一人暮らしや在学中の生活費を入力して、固定費・変動費のバランスと毎月の余裕/赤字をざっくり確認します。",
  },
];

export default function SimIndex() {
  useEffect(() => {
    // シミュ一覧ページに来たことを1回だけ記録
    trackEvent("page_view", { page: "/sim" });
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      {/* ヘッダー */}
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">シミュレーター</h1>
        <p className="text-sm text-neutral-200">
          大学生の「奨学金」と「生活費」にフォーカスした、軽量なシミュレーションツール集です
          （計算のみで保存は行いません）。
        </p>
        <p className="text-xs text-neutral-400">
          実際の条件や生活費は人によって異なるため、あくまで「ざっくりイメージ」を掴むための目安として利用してください。
        </p>
      </header>

      {/* 一覧カード */}
      <section className="space-y-4">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="block rounded-2xl border border-zinc-700/70 bg-zinc-900/70 p-4 md:p-5 transition hover:border-emerald-500/60"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-neutral-50">
                  {it.title}
                </h2>
                <p className="text-sm text-neutral-200">
                  {it.desc}
                </p>
              </div>
              {/* PC だけ右端に「開く →」を表示 */}
              <span className="hidden text-xs text-emerald-300 md:inline">
                開く →
              </span>
            </div>
            {/* スマホでは下に小さく表示して高さを抑える */}
            <p className="mt-2 text-xs text-neutral-400 md:hidden">開く →</p>
          </Link>
        ))}
      </section>
    </main>
  );
}

