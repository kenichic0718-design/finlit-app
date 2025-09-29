// app/api/insights/monthly/route.ts
import { NextResponse } from "next/server";

// ※ あなたの環境にあるサーバークライアントを使います。
//   以前の会話で存在していた getSupabaseRoute を前提にします。
import { getSupabaseRoute } from "@/app/_supabase/server";

export const dynamic = "force-dynamic";

function startEndFromYM(ym?: string) {
  const now = new Date();
  const [y, m] = (ym || now.toISOString().slice(0, 7)).split("-").map(Number);
  const start = new Date(y, (m ?? now.getMonth() + 1) - 1, 1, 0, 0, 0);
  const end = new Date(y, (m ?? now.getMonth() + 1), 1, 0, 0, 0); // 翌月1日
  return { start, end, ym: `${y.toString().padStart(4, "0")}-${(m ?? now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}` };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ym = searchParams.get("month") || undefined;
    const { start, end, ym: resolved } = startEndFromYM(ym);

    const supabase = await getSupabaseRoute();

    // 1) カテゴリ取得（id -> {name, kind}）
    const { data: cats, error: catErr } = await supabase
      .from("categories")
      .select("id, name, kind");
    if (catErr) throw catErr;
    const catMap = new Map<number, { name: string; kind: string }>();
    (cats || []).forEach((c: any) => catMap.set(c.id, { name: c.name, kind: c.kind }));

    // 2) 対象月のログ取得
    const { data: logs, error } = await supabase
      .from("logs")
      .select("amount, kind, category_id, created_at")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    // 3) 集計
    let income = 0;
    let expense = 0;

    // 日別バケット
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const daily = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      income: 0,
      expense: 0,
      net: 0,
    }));

    // カテゴリ別支出
    const byCat = new Map<number, number>();

    for (const row of logs || []) {
      const amt = Number(row.amount) || 0;
      const created = new Date(row.created_at);
      const d = created.getDate();
      if (row.kind === "income") {
        income += amt;
        if (daily[d - 1]) daily[d - 1].income += amt;
      } else {
        expense += amt;
        if (daily[d - 1]) daily[d - 1].expense += amt;
        const cid = row.category_id as number | null;
        if (cid) byCat.set(cid, (byCat.get(cid) || 0) + amt);
      }
    }
    daily.forEach((x) => (x.net = x.income - x.expense));

    const byCategory = Array.from(byCat.entries())
      .map(([id, total]) => ({
        id,
        name: catMap.get(id)?.name || "不明",
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    return NextResponse.json({
      month: resolved,
      income,
      expense,
      net: income - expense,
      daily,
      byCategory,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}

