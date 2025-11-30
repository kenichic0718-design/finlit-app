import Link from "next/link";
import { getJSON } from "@/lib/api";
import { yen, safeDiv, ymLabel } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";

type GoalRow = {
  name: string;       // カテゴリ名
  actual: number;     // 実績（当月、支出は使用額 / 収入は入金額）
  target: number;     // 目標（支出は予算 / 収入は目標）
};
type GoalPageData = {
  month: string;
  kind: "expense" | "income";
  totalActual: number;
  totalTarget: number;
  rows: GoalRow[];
};

async function fetchData(kind: "expense" | "income"): Promise<GoalPageData> {
  return getJSON<GoalPageData>(`/api/goals?kind=${kind}`);
}

export default async function GoalsPage({ searchParams }: { searchParams: { tab?: "expense" | "income" } }) {
  const kind = searchParams.tab === "income" ? "income" : "expense";
  const data = await fetchData(kind);
  const prog = safeDiv(data.totalActual, data.totalTarget);

  const ym = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="text-xl font-semibold">目標</div>
        <div className="text-sm text-neutral-400 ml-auto">{ymLabel(ym)}</div>
        <div className="flex gap-2">
          <Link
            href="/goals?tab=expense"
            className={`px-3 py-1 rounded-md text-sm ${kind === "expense" ? "bg-white/10" : "bg-white/5 hover:bg-white/10"}`}
          >
            支出
          </Link>
          <Link
            href="/goals?tab=income"
            className={`px-3 py-1 rounded-md text-sm ${kind === "income" ? "bg-white/10" : "bg-white/5 hover:bg-white/10"}`}
          >
            収入
          </Link>
          <Link
            href={`/sim/goal?prefill=${encodeURIComponent(JSON.stringify({ month: data.month }))}`}
            className="px-3 py-1 rounded-md text-sm bg-white/5 hover:bg-white/10"
          >
            詳しく試算（/sim/goal）
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-neutral-400">
          {kind === "expense" ? "今月の使用状況" : "今月の達成状況"}
        </h2>
        <div className="mt-1 text-lg">
          {kind === "expense" ? "予算合計" : "目標合計"} {yen(data.totalTarget)} / 実績 {yen(data.totalActual)}
        </div>
        <div className="mt-3"><ProgressBar value={prog} /></div>
      </section>

      <div className="space-y-3">
        {data.rows.map((r) => {
          const p = safeDiv(r.actual, r.target);
          return (
            <div key={r.name} className="rounded-lg border border-white/10 p-3">
              <div className="flex items-center">
                <div className="font-medium">{r.name}</div>
                <div className="text-sm text-neutral-400 ml-auto">
                  実績 {yen(r.actual)} / 目標 {yen(r.target)}
                </div>
                <Link
                  href="/budgets"
                  className="ml-3 text-xs text-neutral-300 hover:text-white underline underline-offset-4"
                >
                  {kind === "expense" ? "予算未設定" : "目標未設定"}
                </Link>
              </div>
              <div className="mt-2"><ProgressBar value={p} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

