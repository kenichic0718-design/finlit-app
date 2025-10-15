// app/api/debug-logs/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const [
      auth,
      cats,
      logs,
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('categories').select('*').limit(20),
      supabase.from('logs').select('*').order('id', { ascending: false }).limit(20),
    ]);

    return NextResponse.json({
      ok: true,
      authedUser: auth.data.user ?? null,
      categories: cats.data ?? [],
      logs: logs.data ?? [],
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}

