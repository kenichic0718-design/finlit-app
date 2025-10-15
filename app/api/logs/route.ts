// app/api/logs/route.ts
import { NextResponse } from 'next/server';
import { getRouteSupabase } from '@/app/_supabase/route';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') ?? '20');

    const supabase = getRouteSupabase();

    // 直近の記録（date DESC, id DESC）
    const { data, error } = await supabase
      .from('logs')
      .select('id, profile_id, date, amount, memo, is_income')
      .order('date', { ascending: false })
      .order('id', { ascending: false })
      .limit(Number.isFinite(limit) ? limit : 20);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'unexpected' }, { status: 500 });
  }
}

