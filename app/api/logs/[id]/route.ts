// app/api/logs/[id]/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

type Params = { params: { id: string } };

export async function PATCH(_req: Request, { params }: Params) {
  try {
    const supabase = getSupabaseServer();
    const id = Number(params.id);
    const body = await _req.json();

    const { data, error } = await supabase
      .from('logs')
      .update({
        amount: body.amount,
        memo: body.memo ?? null,
        category_id: body.category_id ?? null,
        is_income: !!body.is_income,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const supabase = getSupabaseServer();
    const id = Number(params.id);

    const { error } = await supabase.from('logs').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

