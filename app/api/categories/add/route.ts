// app/api/categories/add/route.ts
import { NextResponse } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';

export async function POST(req: Request) {
  try {
    const supabase = getRouteClient();
    const { name, type } = await req.json().catch(() => ({} as any));
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });
    }

    // DB に is_income/position が無い場合も落ちないように最小カラムで insert
    // type -> is_income へマッピング（列が無ければ無視される）
    const toInsert: Record<string, any> = { name };
    if (typeof type === 'string') {
      toInsert.is_income = type === 'income';
    }

    const { error } = await supabase.from('categories').insert([toInsert]);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

