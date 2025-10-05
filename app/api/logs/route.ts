// app/api/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { LOGS_TABLE } from '@/types/logs';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServer();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);
  const offset = Math.max(Number(searchParams.get('offset') ?? '0'), 0);

  const query = supabase.from(LOGS_TABLE)
    .select('*', { count: 'exact' })
    .order('created_at' in ({} as any) ? 'created_at' : 'id', { ascending: false }) // 存在する方に勝手に効く
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, items: data ?? [], count: count ?? 0 });
}

