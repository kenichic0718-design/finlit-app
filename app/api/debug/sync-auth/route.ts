// app/api/debug/sync-auth/route.ts
import { NextResponse } from 'next/server';
import { getSupabase } from '@/app/api/_supabase';

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data: sess, error: e1 } = await supabase.auth.getSession();
    if (e1) {
      return NextResponse.json(
        { ok: false, step: 'getSession', error: e1.message },
        { status: 401 }
      );
    }

    const { data: u, error: e2 } = await supabase.auth.getUser();
    if (e2 || !u?.user) {
      return NextResponse.json(
        { ok: false, step: 'getUser', error: e2?.message ?? 'no_user' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        hasSession: !!sess?.session,
        user: u.user,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        step: 'server',
        error: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
