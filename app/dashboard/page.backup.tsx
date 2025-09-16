'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { monthRange, yyyymm } from '@/lib/date';
import Link from 'next/link';

type LogRow = {
  id: string;
  date: string;       // ISO 文字列
  category: string;   // カテゴリ
  amount: number;     // 金額(支出は正の数で保持)
  memo: string | null;
  is_income?: boolean | null; // 収入フラグ（ある場合）
};

export default function DashboardPage() {
  const supabase = createClient();

  const [ym, setYm] = useState<string>(yyyymm(new Date()));
  const [spendSum, setSpendSum] = useState<number>(0);
  const [incomeSum, setIncomeSum] = useState<number>(0);
  const [surplus, setSurplus] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrMsg(null);

      // （匿名でもOKにするため）ユーザーが取れなくても続行
      // const { data: { user }, error: userErr } = await supabase.auth.getUser();
      // if (userErr || !user) { /* ここで throw しない */ }

      const [y, m] = ym.split('-').map(Number);
      const base = new Date(y, (m ?? 1) - 1, 1);
      const { start, end } = monthRange(base);

      // 今月のログを取得（匿名でも全件から取得。RLSで匿名可のポリシーになっている前提）
      const { data: logs, error: logsErr } = await supabase
        .from('logs')
        .select('*')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString());

      if (logsErr) {
        console.error('Supabase logsErr:', logsErr);
        setErrMsg(logsErr.message || 'ログ取得に失敗しました');
        setLoading(false);
        return;
      }

      const rows: LogRow[] = (logs ?? []) as LogRow[];

      // 収支集計
      let spend = 0;
      let income = 0;
      for (const r of rows) {
        const isIncome = r.is_income ?? false;
        if (isIncome) {
          income += r.amount || 0;
        } else {
          spend += r.amount || 0;
        }
      }
      setSpendSum(spend);
      setIncomeSum(income);
      setSurplus(income - spend);
      setLoading(false);
    };

    fetchData();
  }, [ym, supabase]);

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 text-gray-100 bg-neutral-900">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">FinLit PWA</h1>
        <nav className="flex gap-2">
          <Link href="/dashboard" className="px-3 py-1 rounded-md bg-sky-700/40 hover:bg-sky-700/60">ダッシュボード</Link>
          <Link href="/learn" className="px-3 py-1 rounded-md bg-neutral-700/60 hover:bg-neutral-600">学ぶ</Link>
          <Link href="/log" className="px-3 py-1 rounded-md bg-neutral-700/60 hover:bg-neutral-600">記録</Link>
          <Link href="/goal" className="px-3 py-1 rounded-md bg-neutral-700/60 hover:bg-neutral-600">目標</Link>
          <Link href="/budgets" className="px-3 py-1 rounded-md bg-neutral-700/60 hover:bg-neutral-600">予算</Link>
        </nav>
      </header>

      <section className="max-w-5xl mx-auto">
        <div className="mb-4">
          <label className="mr-2 text-sm text-gray-300">ダッシュボード</label>
          <input
            type="month"
            value={ym}
            onChange={(e) => setYm(e.target.value)}
            className="rounded-md bg-neutral-800 border border-neutral-700 px-3 py-1"
          />
        </div>

        {errMsg && (
          <p className="mb-6 text-red-400">エラー: {errMsg}</p>
        )}

        {loading ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-4">
              <div className="text-sm text-gray-400 mb-1">今月の支出</div>
              <div className="text-3xl font-bold">{spendSum.toLocaleString()}円</div>
            </div>
            <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-4">
              <div className="text-sm text-gray-400 mb-1">今月の収入</div>
              <div className="text-3xl font-bold">{incomeSum.toLocaleString()}円</div>
            </div>
            <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-4">
              <div className="text-sm text-gray-400 mb-1">収支</div>
              <div className={`text-3xl font-bold ${surplus >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {surplus.toLocaleString()}円
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 text-xs text-gray-500">
          © 2025 FinLit. 学んで、記録して、未来を設計しよう。
        </footer>
      </section>
    </main>
  );
}

