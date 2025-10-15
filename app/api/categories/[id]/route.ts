// app/api/categories/[id]/route.ts
import { NextResponse } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const supabase = getRouteClient();
    const { id } = params;
    const { name } = await req.json().catch(() => ({} as any));
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 });
    }
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });
    }

    const { error } = await supabase.from('categories').update({ name }).eq('id', id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

