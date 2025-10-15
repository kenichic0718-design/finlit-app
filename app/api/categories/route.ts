// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';

type RowLoose = {
  id: string;
  name: string;
  is_income?: boolean | null;
  position?: number | null;
};

export async function GET() {
  try {
    const supabase = getRouteClient();
    const from = supabase.from('categories');

    // 1st: 全部（position あり想定）
    let data: RowLoose[] | null = null;

    // 1) id,name,is_income,position
    {
      const { data: d1, error: e1 } = await from.select('id,name,is_income,position');
      if (!e1) data = d1 as RowLoose[]; else {
        // 2) id,name,is_income
        const { data: d2, error: e2 } = await from.select('id,name,is_income');
        if (!e2) data = d2 as RowLoose[]; else {
          // 3) id,name
          const { data: d3, error: e3 } = await from.select('id,name');
          if (e3) {
            return NextResponse.json({ ok: false, error: e3.message }, { status: 500 });
          }
          data = d3 as RowLoose[];
        }
      }
    }

    const rows = data ?? [];

    // UI が期待する形に正規化（position 無ければ 0）
    const items = rows
      .map(r => ({
        id: r.id,
        name: r.name,
        type: r.is_income ? ('income' as const) : ('expense' as const),
        position: r.position ?? 0,
      }))
      // position が無くても安全にソート
      .sort((a, b) => {
        if (a.type !== b.type) return a.type < b.type ? -1 : 1;
        if (a.position !== b.position) return a.position - b.position;
        return a.name.localeCompare(b.name, 'ja');
      });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

