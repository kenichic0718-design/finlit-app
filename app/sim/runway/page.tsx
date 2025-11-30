import 'server-only';
'use client';

import { useEffect, useMemo, useState } from 'react';

type Kind = 'expense' | 'income';

type LogsResp = {
  ok: boolean;
  items: Array<{
    id: string;
    date: string;           // YYYY-MM-DD
    kind: Kind;
    category_id: string | null;
    amount_int: number;
    memo?: string | null;
  }>;
  total_int: number;
  error?: string;
  detail?: string;
};

function ym(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function jpy(n: number) {
  return (n ?? 0).toLocaleString();
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export default function RunwayPage() {
  const [month, setMonth] = useState<string>(ym()); // 初期推定用（当月）
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 入力
  const [balance, setBalance] = useState<number>(0);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [monthlyExpense, setMonthlyExpense] = useState<number>(0);

  // 補助: 初回だけ /api から初期値推定
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // 当月支出
        const eRes = await fetch(`/api/logs?month=${month}&kind=expense`, { credentials: 'include' });
        const eJson: LogsResp = await eRes.json();
        if (eJson?.ok) setMonthlyExpense(Number(eJson.total_int ?? 0));
        // 当月収入
        const iRes = await fetch(`/api/logs?month=${month}&kind=income`, { credentials: 'include' });
        const iJson: LogsResp = await iRes.json();
        if (iJson?.ok) setMonthlyIncome(Number(iJson.total_int ?? 0));
        // 残高は手入力前提（銀行残高）。初期0のままにする。
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [month]);

  // 計算ロジック
  const netPerMonth = useMemo(() => (monthlyIncome || 0) - (monthlyExpense || 0), [monthlyIncome, monthlyExpense]);

  const monthsToZero = useMemo(() => {
    if (netPerMonth >= 0) return Infinity;
    const burn = -netPerMonth;
    if (burn <= 0) return Infinity;
    return balance > 0 ? Math.ceil(balance / burn) : 0;
  }, [balance, netPerMonth]);

  const zeroDate = useMemo(() => {
    if (!isFinite(monthsToZero)) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToZero);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}年${m}月（目安）`;
  }, [monthsToZero]);

  // 推移（最大24ヶ月）
  const series = useMemo(() => {
    const len = 24;
    const arr: Array<{ m: string; bal: number }> = [];
    let b = balance || 0;
    const seed = new Date();
    for (let i = 0; i < len; i++) {
      const d = new Date(seed.getFullYear(), seed.getMonth() + i, 1);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      arr.push({ m: label, bal: b });
      b += netPerMonth;
    }
    return arr;
  }, [balance, netPerMonth]);

  // UIヘルパ（テンキー加算）
  const bump = (setter: (n: number) => void, cur: number, delta: number) => setter((Number(cur) || 0) + delta);

  return (
    <main className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ランウェイ（何ヶ月もつ？）</h1>
        <div className="flex items-center gap-3 text-sm">
          <input
            type="month"
            className="input"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            title="初期値推定に使う当月"
          />
          <button className="btn-primary disabled:opacity-60" disabled={loading} onClick={() => location.reload()}>
            再読込
          </button>
        </div>
      </div>

      {err && (
        <div className="text-xs text-red-300 border border-red-800/40 bg-red-900/20 rounded-xl px-3 py-2">
          初期値の取得に失敗しました：{err}
        </div>
      )}

      {/* 入力カード */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="手持ち残高（円）">
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              className="input flex-1"
              placeholder="例: 50000"
              value={String(balance)}
              onChange={(e) => setBalance(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
            />
            <Numpad onClick={(d) => bump(setBalance, balance, d)} />
          </div>
          <p className="text-xs opacity-70 mt-2">銀行口座などの現在残高。推移の初期値になります。</p>
        </Card>

        <Card title="毎月の収入（円）">
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              className="input flex-1"
              placeholder="例: 80000"
              value={String(monthlyIncome)}
              onChange={(e) => setMonthlyIncome(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
            />
            <Numpad onClick={(d) => bump(setMonthlyIncome, monthlyIncome, d)} />
          </div>
          <p className="text-xs opacity-70 mt-2">初期値は当月の収入合計。必要に応じて上書きしてください。</p>
        </Card>

        <Card title="毎月の支出（円）">
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              className="input flex-1"
              placeholder="例: 60000"
              value={String(monthlyExpense)}
              onChange={(e) => setMonthlyExpense(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
            />
            <Numpad onClick={(d) => bump(setMonthlyExpense, monthlyExpense, d)} />
          </div>
          <p className="text-xs opacity-70 mt-2">初期値は当月の支出合計。サブスクや家賃を含めた見込みでOK。</p>
        </Card>
      </section>

      {/* 結果カード */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="結論">
          {netPerMonth >= 0 ? (
            <>
              <div className="text-3xl font-semibold">黒字 +{jpy(netPerMonth)} 円 / 月</div>
              <p className="text-sm opacity-80 mt-2">
                収入が支出を上回っているため、残高は減りません（ランウェイは実質∞）。貯金の増加ペース：{jpy(netPerMonth)} 円/月。
              </p>
            </>
          ) : (
            <>
              <div className="text-3xl font-semibold">
                あと {monthsToZero === Infinity ? '∞' : `${monthsToZero} ヶ月`} もちます
              </div>
              <p className="text-sm opacity-80 mt-2">
                月次赤字：{jpy(-netPerMonth)} 円。残高が 0 円になる目安：{zeroDate ?? '—'}。
              </p>
            </>
          )}
        </Card>

        <Card title="12ヶ月のざっくり推移">
          <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
            {series.slice(0, 12).map((r) => (
              <div key={r.m} className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-sm opacity-80">{r.m}</div>
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-white/40"
                    style={{
                      width: `${clamp(Math.abs(r.bal) / Math.max(1, Math.abs(series[0].bal)) * 100, 0, 100)}%`,
                    }}
                  />
                </div>
                <div className="w-28 text-right tabular-nums">{jpy(r.bal)} 円</div>
              </div>
            ))}
          </div>
          <p className="text-xs opacity-70 mt-2">* 簡易可視化（グラフライブラリなし）。正確な増減は入力に依存します。</p>
        </Card>
      </section>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-b-panel/40 bg-panel/20 rounded-2xl p-4">
      <div className="text-sm opacity-80 mb-3">{title}</div>
      {children}
    </div>
  );
}

function Numpad({ onClick }: { onClick: (delta: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1000, 10000].map((d) => (
        <button
          key={d}
          type="button"
          className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/10 text-sm"
          onClick={() => onClick(d)}
        >
          +{d.toLocaleString()}
        </button>
      ))}
      <button
        type="button"
        className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/10 text-sm"
        onClick={() => onClick(-1000)}
      >
        -1,000
      </button>
    </div>
  );
}

