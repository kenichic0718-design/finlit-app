// app/_supabase/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const [sess, prof] = await Promise.all([
      supabase.auth.getSession(),
      supabase.from('profile').select('*').limit(1),
    ]);
    return NextResponse.json({
      ok: true,
      session: sess.data.session ? { user: sess.data.session.user } : null,
      profileCount: prof.data?.length ?? 0,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

