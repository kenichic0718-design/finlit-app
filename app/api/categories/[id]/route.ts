// app/api/categories/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getRouteSupabase } from '@/app/_supabase/route';

type Ctx = { params: { id: string } };

// DELETE /api/categories/:id
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }

    const supabase = getRouteSupabase();

    // 影響行数を確実に取得するため、.select('id') を付ける
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const deleted = data?.length ?? 0;
    if (deleted === 0) {
      // id が違う・RLS で消せない等
      return NextResponse.json({ ok: false, error: 'Not found', deleted }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

