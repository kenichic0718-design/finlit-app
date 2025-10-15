// app/api/debug-logs/route.ts
import { NextResponse } from 'next/server';
import { getRouteSupabase } from '@/app/_supabase/route';

export async function GET() {
  try {
    const supabase = getRouteSupabase();

    const auth = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('logs')
      .select('id, profile_id, date, amount, memo, is_income')
      .order('id', { ascending: false })
      .limit(5);

    return NextResponse.json({
      ok: !error,
      auth_error: auth.error?.message ?? null,
      items: data ?? [],
      error: error?.message ?? null,
    }, { status: error ? 500 : 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'unexpected' }, { status: 500 });
  }
}

