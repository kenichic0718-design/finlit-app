// app/sim/loan/Client.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MoneyInput } from "@/components/MoneyInput";
import { yen } from "@/lib/format";
import { trackEvent } from "@/lib/telemetry";

type Kind = "no-interest" | "interest"; // 第一種 / 第二種

// 金額（円）を「◯〜◯万円」のレンジ文字列に変換
function bandManYen(value: number, stepMan: number): string {
  if (!Number.isFinite(value) || value <= 0) return "unknown";
  const man = value / 10_000;
  const low = Math.floor(man / stepMan) * stepMan;
  const high = low + stepMan;
  return `${low}-${high}`; // 例: "0-200"（万円）
}

export default function LoanSim() {
  const [kind, setKind] = useState<Kind>("no-interest");
  const [principal, setPrincipal] = useState(2_400_000); // 元金（例: 月4万×5年）
  const [n, setN] = useState(180); // 返済回数（月）
  const [ratePercent, setRatePercent] = useState(1.0); // 年利（%）
  const [netIncome, setNetIncome] = useState(200_000); // 想定手取り月収

  // 「初回レンダーかどうか」を判定するためのフラグ
  const didFirstRunRef = useRef(false);

  useEffect(() => {
    // 奨学金シミュ画面を開いたことを記録
    trackEvent("sim_scholar_view", { page: "/sim/loan" });
  }, []);

  const r = useMemo(() => ratePercent / 100 / 12, [ratePercent]); // 月利

  const monthly = useMemo(() => {
    if (!Number.isFinite(principal) || principal <= 0) return 0;
    if (!Number.isFinite(n) || n <= 0) return 0;

    if (kind === "no-interest") {
      // 第一種（無利子）: 単純に割る
      return Math.ceil(principal / n);
    }

    // 第二種など、利息ありの元利均等返済の近似計算
    if (r === 0) return Math.ceil(principal / n);
    const a =
      (principal * r * Math.pow(1 + r, n)) /
      (Math.pow(1 + r, n) - 1);
    return Math.ceil(a);
  }, [kind, principal, n, r]);

  const total = useMemo(() => monthly * n, [monthly, n]);
  const interestTotal = useMemo(
    () => Math.max(0, total - principal),
    [total, principal],
  );

  const burdenRate = useMemo(() => {
    if (!netIncome || netIncome <= 0 || !monthly) return 0;
    return (monthly / netIncome) * 100;
  }, [monthly, netIncome]);

  const burdenLabel = useMemo(() => {
    if (!netIncome || netIncome <= 0) {
      return "卒業後の手取り月収を入れると、返済負担の重さをざっくり評価します。";
    }
    if (!monthly) {
      return "借入額や返済回数を入力すると、毎月の返済額と負担率が計算されます。";
    }
    const r = burdenRate;
    if (r < 5) {
      return "返済負担率は5％未満で、かなり余裕のある水準です。ほかの固定費とのバランスも見ながら無理なく返済できる可能性が高いです。";
    }
    if (r < 10) {
      return "返済負担率はおおよそ5〜10％で、比較的余裕のある水準です。家賃や生活費とあわせて、少し貯蓄も狙えるレベルです。";
    }
    if (r < 20) {
      return "返済負担率はおおよそ10〜20％で、やや重めの水準です。家賃・通信費・サブスクなどの固定費との兼ね合いをよく検討する必要があります。";
    }
    return "返済負担率は20％以上で、かなり重い水準です。借入額を減らす・返済期間を延ばす・入学先や生活費を見直すなど、別の選択肢も含めて再検討した方がよいレベルです。";
  }, [burdenRate, monthly, netIncome]);

  // ★ 追加：入力条件が変わったときの「シミュ実行」テレメトリ
  useEffect(() => {
    // 初回レンダー時はスキップ（デフォルト値で1回だけ発火するのを防ぐ）
    if (!didFirstRunRef.current) {
      didFirstRunRef.current = true;
      return;
    }

    // 有効な計算ができない状態なら送らない
    if (!Number.isFinite(principal) || principal <= 0) return;
    if (!Number.isFinite(n) || n <= 0) return;
    if (!monthly || monthly <= 0) return;

    const principalBand = bandManYen(principal, 200); // 200万円刻み
    const incomeBand = bandManYen(netIncome, 5); // 5万円刻み
    const years = Math.round(n / 12); // おおよその返済年数

    void trackEvent("sim_scholar_run", {
      kind, // "no-interest" | "interest"
      principalBand, // 例: "0-200" （万円）
      incomeBand, // 例: "15-20" （万円）
      years,
      ratePercent,
    });
  }, [kind, principal, n, ratePercent, netIncome, monthly]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* ヘッダー */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">奨学金 返済シミュレーター</h1>
        <p className="text-sm text-neutral-400">
          第一種/第二種の借入額・利率・返済期間と、卒業後の想定手取り月収から、
          毎月の返済額と返済負担率をざっくり確認できます（計算は近似です）。
        </p>
      </header>

      {/* 入力エリア */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-neutral-200">
            奨学金の条件
          </h2>

          <label className="block space-y-1">
            <span className="text-xs text-neutral-400">種類</span>
            <select
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm"
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
            >
              <option value="no-interest">第一種（無利子）</option>
              <option value="interest">第二種（有利子）</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-neutral-400">
              元金（合計借入額）
            </span>
            <MoneyInput
              value={principal}
              onChange={(v) => setPrincipal(Math.max(0, v))}
              placeholder="例: 2,400,000"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-neutral-400">
              返済回数（月）※ 120ヶ月 = 10年
            </span>
            <input
              type="number"
              min={1}
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm"
              value={n}
              onChange={(e) =>
                setN(Math.max(1, Number(e.target.value || 0)))
              }
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-neutral-400">
              年利（％）※ 第一種は 0％
            </span>
            <input
              type="number"
              step="0.01"
              min={0}
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm disabled:opacity-60"
              value={ratePercent}
              onChange={(e) =>
                setRatePercent(Math.max(0, Number(e.target.value || 0)))
              }
              disabled={kind === "no-interest"}
            />
          </label>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-neutral-200">
            卒業後のイメージ
          </h2>

          <label className="block space-y-1">
            <span className="text-xs text-neutral-400">
              卒業後の想定 手取り月収
            </span>
            <MoneyInput
              value={netIncome}
              onChange={(v) => setNetIncome(Math.max(0, v))}
              placeholder="例: 200,000"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              初任給の手取り（額面から税金や社会保険料を引いたイメージ）を入れると、
              奨学金の返済が家計にどのくらい効いてくるかを確認できます。
            </p>
          </label>
        </div>
      </section>

      {/* 結果エリア */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-neutral-300">毎月の返済額</span>
            <strong className="text-xl">{yen(monthly)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-300">総返済額（元金＋利息）</span>
            <strong>{yen(total)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-300">うち利息</span>
            <strong>{yen(interestTotal)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-300">
              返済負担率（手取りに占める割合）
            </span>
            <strong>
              {Number.isFinite(burdenRate)
                ? `${burdenRate.toFixed(1)}%`
                : "--"}
            </strong>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-white/10 bg-black/30 p-4 text-sm text-neutral-400 leading-relaxed">
          <p>{burdenLabel}</p>
          <p className="text-[11px] text-neutral-500">
            ※ 元利均等返済の近似計算です。実際の返済額や利息は、
            利率の見直しや繰上返還などにより変動する場合があります。
            詳細は日本学生支援機構（JASSO）の返還シミュレーション等をご確認ください。
          </p>
        </div>
      </section>
    </div>
  );
}

