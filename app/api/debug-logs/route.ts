// app/api/debug-logs/route.ts
import { NextResponse } from 'next/server';
import { getSupabase } from '@/app/api/_supabase';

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data: authUser, error: authError } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('logs')
      .select('id, profile_id, date, amount, memo, is_income')
      .order('id', { ascending: false })
      .limit(5);

    return NextResponse.json(
      {
        ok: !error,
        auth_error: authError?.message ?? null,
        items: data ?? [],
        error: error?.message ?? null,
      },
      { status: error ? 500 : 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'unexpected' },
      { status: 500 }
    );
  }
}
