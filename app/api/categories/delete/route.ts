// app/api/categories/delete/route.ts
import { NextResponse } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';

export async function POST(req: Request) {
  try {
    const supabase = getRouteClient();
    const { id } = await req.json().catch(() => ({} as any));
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 });
    }
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

