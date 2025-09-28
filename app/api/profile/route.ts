import { NextResponse } from 'next/server';
import { ensureProfile } from '@/app/_supabase/server';

export async function GET() {
  try {
    const me = await ensureProfile();
    return NextResponse.json({ ok: true, profile: me }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown' }, { status: 500 });
  }
}

