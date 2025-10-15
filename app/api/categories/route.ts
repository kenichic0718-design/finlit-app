// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';

export async function GET() {
  try {
    const supabase = getRouteClient();

    // カテゴリ一覧（支出/収入の両方を position 付きで取得）
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, type, position')
      .order('type', { ascending: true })
      .order('position', { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

