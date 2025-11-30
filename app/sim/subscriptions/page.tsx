// app/sim/subscriptions/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { detectSubscriptions } from '@/lib/subscriptions/detect';
import { LOOSE_PRESET, STRICT_PRESET, SubscriptionDetectConfig } from '@/lib/subscriptions/config';

type LogItem = {
  date: string;
  kind: 'expense' | 'income';
  amount_int: number;
  memo?: string | null;
  category_name?: string | null;
};
type LogRes =
  | { ok: true; items: LogItem[]; total_int?: number }
  | { ok: false; error: string; detail?: string };

// 月文字列を±nヶ月ずらす
function ymAdd(month: string, diff: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, (m - 1) + diff, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// 当月/過去月の支出ログを取得（契約は現状維持）
async function fetchMonth(kind: 'expense' | 'income', month: string): Promise<LogRes> {
  const r = await fetch(`/api/logs?month=${month}&kind=${kind}`, { credentials: 'include' });
  return r.json();
}

export default function Page() {
  // 既定：ゆるめ・1ヶ月分・今月
  const [mode, setMode] = useState<'loose' | 'strict'>('loose');
  const [monthsSpan, setMonthsSpan] = useState<number>(1);
  const [ym, setYm] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LogItem[]>([]);

  // チェック済み候補の管理（この画面だけのローカル状態）
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const cfg: SubscriptionDetectConfig = mode === 'loose' ? LOOSE_PRESET : STRICT_PRESET;

  // 再読込
  const reload = async () => {
    setLoading(true);
    setSelected(new Set()); // 期間/モード変更時は一旦リセット
    const acc: LogItem[] = [];
    for (let i = 0; i < monthsSpan; i++) {
      const m = ymAdd(ym, -i);
      const res = await fetchMonth('expense', m);
      if (res.ok) acc.push(...res.items);
    }
    setRows(acc);
    setLoading(false);
  };

  useEffect(() => {
    // 初回 & 依存変更時
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym, monthsSpan, mode]);

  // サブスク候補を推定
  const cands = useMemo(() => detectSubscriptions(rows, cfg), [rows, cfg]);
  // 合計（検出された全候補ベース）
  const monthlySavingAll = useMemo(() => cands.reduce((s: number, c: any) => s + (c.averageYen ?? 0), 0), [cands]);
  // 選択中の合計
  const monthlySavingSelected = useMemo(
    () =>
      cands.reduce((s: number, c: any, i: number) => {
        const id = String(c.id ?? `${c.label ?? 'cand'}-${i}`);
        return selected.has(id) ? s + (c.averageYen ?? 0) : s;
      }, 0),
    [cands, selected]
  );

  // ボタンの見た目（選択/未選択）
  const activeBtn = 'bg-primary text-primary-foreground ring-2 ring-primary/60';
  const inactiveBtn = 'bg-transparent text-ink/80 hover:bg-muted border border-line';

  // チェック切替
  const toggleChecked = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 全選択/全解除
  const selectAll = () => {
    const newSet = new Set<string>();
    cands.forEach((c: any, i: number) => {
      const id = String(c.id ?? `${c.label ?? 'cand'}-${i}`);
      newSet.add(id);
    });
    setSelected(newSet);
  };
  const clearAll = () => setSelected(new Set());

  return (
    <main className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">サブスク見直し</h1>

      {/* フィルタ群 */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* 厳密 / ゆるめ */}
        <div className="flex gap-1 rounded-xl bg-surface border border-line p-1">
          <button
            type="button"
            onClick={() => setMode('strict')}
            aria-pressed={mode === 'strict'}
            className={`px-3 py-1 rounded-lg transition ${mode === 'strict' ? activeBtn : inactiveBtn}`}
          >
            厳密
          </button>
          <button
            type="button"
            onClick={() => setMode('loose')}
            aria-pressed={mode === 'loose'}
            className={`px-3 py-1 rounded-lg transition ${mode === 'loose' ? activeBtn : inactiveBtn}`}
          >
            ゆるめ
          </button>
        </div>

        {/* 期間 */}
        <div className="flex gap-1 rounded-xl bg-surface border border-line p-1 ml-2">
          {[1, 2, 3, 6, 12].map(n => (
            <button
              type="button"
              key={n}
              onClick={() => setMonthsSpan(n)}
              aria-pressed={monthsSpan === n}
              className={`px-3 py-1 rounded-lg transition ${monthsSpan === n ? activeBtn : inactiveBtn}`}
            >
              {n}ヶ月分
            </button>
          ))}
        </div>

        {/* 月選択 & 再読込 */}
        <div className="ml-auto flex gap-2 items-center">
          <input
            type="month"
            value={ym}
            onChange={e => setYm(e.target.value)}
            className="bg-surface border border-line rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
          <button type="button" onClick={reload} className={`px-3 py-1 rounded-lg transition ${inactiveBtn}`}>
            再読込
          </button>
        </div>
      </div>

      {/* Sticky サマリ（選択状態も明示） */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-line py-2">
        <div className="text-sm flex flex-wrap gap-x-4 gap-y-1 items-center">
          <span>候補: <span className="font-semibold">{cands.length}件</span></span>
          <span>見直し効果（毎月/全候補）: <span className="font-semibold">{monthlySavingAll.toLocaleString()}円</span></span>
          <span className="opacity-80">モード: <span className="font-medium">{mode === 'loose' ? 'ゆるめ' : '厳密'}</span></span>
          <span className="opacity-80">期間: <span className="font-medium">{monthsSpan}ヶ月分</span></span>
          <span className="opacity-70 ml-auto">（検出窓:直近{cfg.detectionWindowWeeks}週 / 反復≧{cfg.minOccurrences} / 近似±{Math.round(cfg.amountTolerancePct * 100)}%）</span>
        </div>
      </div>

      {/* 選択サマリ（この画面だけの合計） */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-lg font-semibold">
            選択中の見直し効果：毎月 {monthlySavingSelected.toLocaleString()}円
            <span className="text-sm opacity-70 ml-2">（年間 {(monthlySavingSelected * 12).toLocaleString()}円）</span>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={selectAll} className={`px-3 py-1 rounded-lg transition ${inactiveBtn}`}>全選択</button>
            <button onClick={clearAll} className={`px-3 py-1 rounded-lg transition ${inactiveBtn}`}>全解除</button>
          </div>
        </div>
        <p className="text-xs opacity-70 mt-1">※ この選択はこの画面だけの一時的なものです。確定の解約/停止は各サービス側で行ってください。</p>
      </section>

      {/* 説明 */}
      <p className="text-xs opacity-70">
        直近{cfg.detectionWindowWeeks}週間の支出から定期性を推定し、選択中の期間（{monthsSpan}ヶ月）に合わせて候補を並べています。
        候補は金額近似・反復回数・リズム（毎月/隔月/週次）・メモ語彙のスコアでソートします。
      </p>

      {/* 候補リスト */}
      <section className="space-y-3">
        {loading && <div className="text-sm opacity-70">読込中…</div>}
        {!loading && cands.length === 0 && (
          <div className="text-sm opacity-70 border border-dashed border-line rounded-xl p-4">
            候補が見つかりませんでした。モードを「ゆるめ」に、期間を「3ヶ月」にすると検出されやすくなります。
          </div>
        )}

        {!loading &&
          cands.map((c: any, idx: number) => {
            const id = String(c.id ?? `${c.label ?? 'cand'}-${idx}`);
            const checked = selected.has(id);
            return (
              <article key={id} className="rounded-xl border border-line bg-surface px-4 py-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 accent-primary"
                    checked={checked}
                    onChange={() => toggleChecked(id)}
                    aria-label={`${c.label ?? '候補'} を選択`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{c.label ?? '(カテゴリ不明)'}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          c.confidence === '高'
                            ? 'bg-emerald-600/15 text-emerald-300 border-emerald-700/50'
                            : c.confidence === '中'
                            ? 'bg-amber-600/15 text-amber-300 border-amber-700/50'
                            : 'bg-zinc-600/15 text-zinc-300 border-zinc-700/50'
                        }`}
                      >
                        確度: {c.confidence ?? '低'}
                      </span>
                      <span className="ml-auto font-semibold">{(c.averageYen ?? 0).toLocaleString()}円</span>
                    </div>
                    <p className="text-xs mt-1 opacity-75">
                      直近{c.occurrences ?? 0}回 / 平均 {(c.averageYen ?? 0).toLocaleString()}円 /{' '}
                      {c.rhythm === 'weekly' ? '週次' : c.rhythm === 'bi-monthly' ? '隔月' : c.rhythm === 'monthly' ? '毎月' : '規則不明'}
                    </p>
                    <p className="text-xs mt-1 opacity-60">※ チェック後の変更・解約は各サービス側で行ってください（この画面では保存しません）。</p>
                  </div>
                </div>
              </article>
            );
          })}
      </section>
    </main>
  );
}
