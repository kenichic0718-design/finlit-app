// app/budgets/_PageClient.tsx
"use client";

import { useState } from "react";
import BudgetList from "./BudgetList";

/** 今日の年月 (YYYY-MM) を返す */
function currentYm(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}

/**
 * 予算ページ クライアント本体
 *
 * - 対象月の選択
 * - BudgetList でカテゴリ別予算を表示・編集
 */
export default function PageClient() {
  const [ym, setYm] = useState<string>(currentYm());

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 sm:p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">予算</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          月ごとのカテゴリ別予算を管理します。金額は 100 円単位で入力できます。
        </p>
      </header>

      {/* 対象月の選択 */}
      <section className="rounded-2xl border bg-background/40 p-4 space-y-2">
        <div className="text-sm font-medium">対象月</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <input
            type="month"
            value={ym}
            onChange={(e) => setYm(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </section>

      {/* 一覧（インライン編集） */}
      <section>
        <BudgetList ym={ym} />
      </section>
    </div>
  );
}

