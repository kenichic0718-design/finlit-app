// app/api/categories/[id]/route.ts
import { NextResponse } from 'next/server';
import { getRouteSupabase } from '@/app/_supabase/route';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { name } = body ?? {};

    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });
    }

    const sb = getRouteSupabase();
    // 古いスキーマでも name は存在する前提で update
    const { error } = await sb.from('categories').update({ name }).eq('id', id);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });

    const sb = getRouteSupabase();
    const { error } = await sb.from('categories').delete().eq('id', id);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

