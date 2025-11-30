// app/sim/budget/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MoneyInput } from "@/components/MoneyInput";
import { yen } from "@/lib/format";
import { trackEvent } from "@/lib/telemetry";

// 金額（円）を「◯〜◯万円」のレンジ文字列に変換
function bandManYen(value: number, stepMan: number): string {
  if (!Number.isFinite(value) || value <= 0) return "unknown";
  const man = value / 10_000;
  const low = Math.floor(man / stepMan) * stepMan;
  const high = low + stepMan;
  return `${low}-${high}`; // 例: "10-15"（万円）
}

// 割合（%）をレンジ文字列に変換
function bandPercent(value: number, step: number): string {
  if (!Number.isFinite(value) || value < 0) return "unknown";
  const low = Math.floor(value / step) * step;
  const high = low + step;
  return `${low}-${high}`; // 例: "30-40"（%）
}

export default function BudgetSimPage() {
  const [income, setIncome] = useState(150_000); // 手取り月収
  const [rent, setRent] = useState(50_000);
  const [utilities, setUtilities] = useState(10_000); // 光熱費
  const [communication, setCommunication] = useState(7_000); // 通信費
  const [subscriptions, setSubscriptions] = useState(3_000); // サブスク
  const [food, setFood] = useState(30_000);
  const [hobby, setHobby] = useState(15_000);
  const [other, setOther] = useState(5_000);

  // 初回レンダー判定用フラグ
  const didFirstRunRef = useRef(false);

  useEffect(() => {
    // 生活費シミュ画面を開いたことを記録
    trackEvent("sim_budget_view", { page: "/sim/budget" });
  }, []);

  const fixedTotal = useMemo(
    () => rent + utilities + communication + subscriptions,
    [rent, utilities, communication, subscriptions]
  );
  const variableTotal = useMemo(
    () => food + hobby + other,
    [food, hobby, other]
  );
  const totalExpense = useMemo(
    () => fixedTotal + variableTotal,
    [fixedTotal, variableTotal]
  );
  const balance = useMemo(
    () => income - totalExpense,
    [income, totalExpense]
  );

  const rentRate = useMemo(
    () => (income > 0 ? (rent / income) * 100 : 0),
    [rent, income]
  );
  const fixedRate = useMemo(
    () => (income > 0 ? (fixedTotal / income) * 100 : 0),
    [fixedTotal, income]
  );

  const balanceLabel = useMemo(() => {
    if (!income || income <= 0) {
      return "手取り月収を入力すると、毎月の余裕/赤字のイメージが掴みやすくなります。";
    }
    if (balance > 0) {
      return "毎月プラスになっています。この余裕分を「生活防衛資金」や将来のための貯蓄に回せると安心です。";
    }
    if (balance === 0) {
      return "収入と支出がちょうどトントンの状態です。予期せぬ出費に備えるには、どこか一部の支出を少し抑える工夫も検討したい水準です。";
    }
    return "毎月赤字の状態です。家賃や固定費、交際費などを見直すか、収入を増やす必要があります。奨学金の使い方やバイト時間とのバランスも含めて検討が必要なレベルです。";
  }, [income, balance]);

  const rentLabel = useMemo(() => {
    if (!income || income <= 0 || !rent) return "";
    const r = rentRate;
    if (r < 20) {
      return "家賃は手取りの20％未満で、一般的な目安（20〜30％）よりも低めの、比較的ゆとりある水準です。";
    }
    if (r <= 30) {
      return "家賃は手取りの20〜30％程度で、よく言われる目安の範囲内です。他の固定費や貯蓄とのバランスを意識しましょう。";
    }
    return "家賃が手取りの30％を超えています。一人暮らしの希望や通学時間とのバランスを見つつも、長期的にはやや重めの水準です。";
  }, [income, rent, rentRate]);

  const fixedLabel = useMemo(() => {
    if (!income || income <= 0 || !fixedTotal) return "";
    const r = fixedRate;
    if (r <= 40) {
      return "家賃・光熱費・通信費・サブスクといった固定費は、手取りの40％以下で比較的抑えられています。";
    }
    if (r <= 50) {
      return "固定費が手取りの40〜50％程度です。特にサブスクや通信費が膨らんでいないか、時々見直すと安心です。";
    }
    return "固定費が手取りの半分以上を占めています。生活が変わらなくても毎月必ず出ていくお金なので、家賃やサブスクを含めて見直し候補がないか考えてみる必要があります。";
  }, [income, fixedTotal, fixedRate]);

  // ★ 追加：入力条件が変わったときの「シミュ実行」テレメトリ
  useEffect(() => {
    // 初回レンダー時はスキップ（デフォルト値で1回だけ送られるのを防ぐ）
    if (!didFirstRunRef.current) {
      didFirstRunRef.current = true;
      return;
    }

    if (!Number.isFinite(income) || income <= 0) return;
    if (!Number.isFinite(totalExpense) || totalExpense < 0) return;

    const incomeBand = bandManYen(income, 5); // 5万円刻み
    const fixedRatioBand = bandPercent(fixedRate, 10); // 10％刻み
    const resultStatus =
      balance > 0 ? "surplus" : balance < 0 ? "deficit" : "break_even";

    void trackEvent("sim_budget_run", {
      incomeBand, // 例: "10-15"（万円）
      fixedRatioBand, // 例: "30-40"（%）
      resultStatus, // "surplus" | "deficit" | "break_even"
    });
  }, [income, totalExpense, fixedRate, balance]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      {/* ヘッダー */}
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">生活費バランスシミュレーター</h1>
        <p className="text-sm text-muted-foreground">
          一人暮らしや在学中の生活費について、「手取り月収に対してどれくらい固定費・変動費がかかっているか」をざっくり確認するためのツールです。
          入力した値は保存されません。
        </p>
      </header>

      {/* 入力エリア */}
      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* 収入 */}
          <div className="space-y-3 rounded-2xl border border-border bg-card/80 p-4">
            <h2 className="text-sm font-semibold text-foreground">
              収入（手取りベース）
            </h2>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">
                手取り月収（バイト＋仕送りなど）
              </span>
              <MoneyInput
                value={income}
                onChange={(v) => setIncome(Math.max(0, v))}
                placeholder="例: 150,000"
              />
              <p className="text-[11px] text-muted-foreground">
                「額面」ではなく、税金や社会保険料を引いたあとの手取りのイメージで入力します。
              </p>
            </label>
          </div>

          {/* 固定費 */}
          <div className="space-y-3 rounded-2xl border border-border bg-card/80 p-4">
            <h2 className="text-sm font-semibold text-foreground">
              固定費（毎月ほぼ同じ額）
            </h2>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">家賃</span>
              <MoneyInput
                value={rent}
                onChange={(v) => setRent(Math.max(0, v))}
                placeholder="例: 50,000"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">
                光熱費（電気・ガス・水道）
              </span>
              <MoneyInput
                value={utilities}
                onChange={(v) => setUtilities(Math.max(0, v))}
                placeholder="例: 10,000"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">
                通信費（スマホ＋自宅ネット）
              </span>
              <MoneyInput
                value={communication}
                onChange={(v) => setCommunication(Math.max(0, v))}
                placeholder="例: 7,000"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">
                サブスク合計（動画・音楽・その他）
              </span>
              <MoneyInput
                value={subscriptions}
                onChange={(v) => setSubscriptions(Math.max(0, v))}
                placeholder="例: 3,000"
              />
            </label>
          </div>
        </div>

        {/* 変動費 */}
        <div className="space-y-3 rounded-2xl border border-border bg-card/80 p-4">
          <h2 className="text-sm font-semibold text-foreground">
            変動費（使い方で増減する部分）
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">食費</span>
              <MoneyInput
                value={food}
                onChange={(v) => setFood(Math.max(0, v))}
                placeholder="例: 30,000"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">
                交際費・趣味
              </span>
              <MoneyInput
                value={hobby}
                onChange={(v) => setHobby(Math.max(0, v))}
                placeholder="例: 15,000"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">
                その他（医療・美容など）
              </span>
              <MoneyInput
                value={other}
                onChange={(v) => setOther(Math.max(0, v))}
                placeholder="例: 5,000"
              />
            </label>
          </div>
        </div>
      </section>

      {/* 結果エリア */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-border bg-card/80 p-4">
          <h2 className="text-sm font-semibold text-foreground mb-1">
            月全体のバランス
          </h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">合計支出</span>
            <span className="font-semibold">{yen(totalExpense)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">固定費 合計</span>
            <span className="font-semibold">{yen(fixedTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">変動費 合計</span>
            <span className="font-semibold">{yen(variableTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-border/60">
            <span className="text-muted-foreground">
              今月の収支（収入 − 支出）
            </span>
            <span
              className={`font-semibold ${
                balance >= 0 ? "text-emerald-500" : "text-red-400"
              }`}
            >
              {yen(balance)}
            </span>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-border bg-card/80 p-4">
          <h2 className="text-sm font-semibold text-foreground mb-1">
            固定費の比率
          </h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              家賃の割合（手取りに対して）
            </span>
            <span className="font-semibold">
              {income > 0 ? `${rentRate.toFixed(1)}%` : "--"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              固定費の割合（手取りに対して）
            </span>
            <span className="font-semibold">
              {income > 0 ? `${fixedRate.toFixed(1)}%` : "--"}
            </span>
          </div>
        </div>
      </section>

      {/* 解説エリア */}
      <section className="space-y-3 rounded-2xl border border-border bg-card/80 p-4 text-sm leading-relaxed text-muted-foreground">
        <p>{balanceLabel}</p>
        {rentLabel && <p>{rentLabel}</p>}
        {fixedLabel && <p>{fixedLabel}</p>}
        <p className="text-xs">
          ※ あくまで「ざっくりとした目安」です。実際には月ごとの光熱費や交際費の変動、
          奨学金返済や保険料なども含めて、個別の事情に応じた調整が必要です。
          このシミュレーターは、その最初のイメージ作りをサポートすることを目的としています。
        </p>
      </section>
    </main>
  );
}

