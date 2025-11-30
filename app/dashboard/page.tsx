import { getJSON } from "@/lib/api";
import { yen, safeDiv, ymLabel } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";

type MonthAgg = {
  month: string; // "2025-11"
  expenseTotal: number; // 当月の支出合計
  incomeTotal: number;  // 当月の収入合計
};
type BudgetAgg = {
  month: string;
  expenseBudgetTotal: number; // 当月の支出予算合計（カテゴリ合計）
  incomeGoalTotal: number;    // 当月の収入目標合計（カテゴリ合計）
};

async function fetchData(): Promise<{ m: MonthAgg; b: BudgetAgg }> {
  const [m, b] = await Promise.all([
    getJSON<MonthAgg>("/api/logs?kind=month-agg"),
    getJSON<BudgetAgg>("/api/budgets?kind=month-agg"),
  ]);
  return { m, b };
}

export default async function Dashboard() {
  const { m, b } = await fetchData();
  const expenseUsage = safeDiv(m.expenseTotal, b.expenseBudgetTotal);
  const incomeProg = safeDiv(m.incomeTotal, b.incomeGoalTotal);

  const now = new Date();
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-lg font-semibold">支出（当月）</h2>
        <p className="text-sm text-neutral-400">{ymLabel(now)}</p>
        <div className="mt-4 text-3xl font-bold">{yen(m.expenseTotal)}</div>
        <p className="text-sm text-neutral-400 mt-1">
          予算 {yen(b.expenseBudgetTotal)} / 残り {yen(b.expenseBudgetTotal - m.expenseTotal)}
        </p>
        <div className="mt-3"><ProgressBar value={expenseUsage} /></div>
        <p className="text-xs text-neutral-400 mt-2">
          ※ 予算はカテゴリ合算値。未設定の場合は 0 として扱います。
        </p>
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-lg font-semibold">収入（当月）</h2>
        <p className="text-sm text-neutral-400">{ymLabel(now)}</p>
        <div className="mt-4 text-3xl font-bold">{yen(m.incomeTotal)}</div>
        <p className="text-sm text-neutral-400 mt-1">
          目標 {yen(b.incomeGoalTotal)} / 残り {yen(Math.max(0, b.incomeGoalTotal - m.incomeTotal))}
        </p>
        <div className="mt-3"><ProgressBar value={incomeProg} /></div>
        <p className="text-xs text-neutral-400 mt-2">
          ※ 収入は「目標に対する達成率」を表示します。
        </p>
      </section>
    </div>
  );
}

