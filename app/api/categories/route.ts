// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';

type RowLoose = {
  id: string;
  name: string;
  // 存在しない可能性がある列
  is_income?: boolean | null;
  position?: number | null;
};

export async function GET() {
  try {
    const supabase = getRouteClient();
    const base = supabase.from('categories');

    // まず is_income/position 付きで取りにいく
    let { data, error } = await base
      .select('id,name,is_income,position')
      .order('position', { ascending: true });

    // 列がない等で失敗したら最小構成で再取得
    if (error) {
      // 列未存在エラーなど
      const retry = await base.select('id,name');
      data = retry.data as RowLoose[] | null;
      if (retry.error) {
        return NextResponse.json(
          { ok: false, error: retry.error.message },
          { status: 500 }
        );
      }
    }

    const rows = (data ?? []) as RowLoose[];

    // APIの期待形に正規化
    const items = rows
      .map((r) => ({
        id: r.id,
        name: r.name,
        type: r.is_income ? ('income' as const) : ('expense' as const),
        position: r.position ?? 0,
      }))
      // type -> position -> name の順で並べ替え（UIの見やすさ用）
      .sort((a, b) => {
        if (a.type !== b.type) return a.type < b.type ? -1 : 1;
        if ((a.position ?? 0) !== (b.position ?? 0))
          return (a.position ?? 0) - (b.position ?? 0);
        return a.name.localeCompare(b.name, 'ja');
      });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

