// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';

type RowLoose = {
  id: string;
  name: string;
  is_income?: boolean | null; // 無い環境もある想定
  position?: number | null;
};

export async function GET() {
  try {
    const supabase = getRouteClient();
    const from = supabase.from('categories');

    // まずフル項目で挑戦
    let { data, error } = await from
      .select('id,name,is_income,position')
      .order('position', { ascending: true });

    // 列が無くて失敗したら最小構成で再取得
    if (error) {
      const retry = await from.select('id,name');
      if (retry.error) {
        return NextResponse.json(
          { ok: false, error: retry.error.message },
          { status: 500 }
        );
      }
      data = retry.data as RowLoose[] | null;
    }

    const rows = (data ?? []) as RowLoose[];

    // UI が期待する形に正規化
    const items = rows
      .map((r) => ({
        id: r.id,
        name: r.name,
        type: r.is_income ? ('income' as const) : ('expense' as const),
        position: r.position ?? 0,
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type < b.type ? -1 : 1;
        if (a.position !== b.position) return a.position - b.position;
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

