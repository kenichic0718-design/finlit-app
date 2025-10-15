// app/api/logs/[id]/route.ts
import { NextResponse } from 'next/server';
import { getRouteSupabase } from '@/app/_supabase/route';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sb = getRouteSupabase();

    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: 'Auth session missing!' },
        { status: 401 }
      );
    }

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid log id' }, { status: 400 });
    }

    // 返り値を取得して「実際に何件消えたか」をチェック
    const { data, error } = await sb
      .from('logs')
      .delete()
      .eq('id', id)
      .eq('profile_id', user.id)
      .select('id'); // ← これが重要

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Not found or not owned', deleted: 0 },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, deleted: data.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sb = getRouteSupabase();
    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: 'Auth session missing!' },
        { status: 401 }
      );
    }

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid log id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const memo = (body.memo ?? null) as string | null;

    if (!Number.isFinite(amount)) {
      return NextResponse.json({ ok: false, error: 'amount must be a number' }, { status: 400 });
    }

    const { data, error } = await sb
      .from('logs')
      .update({ amount, memo })
      .eq('id', id)
      .eq('profile_id', user.id)
      .select('id'); // 0件更新検知

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Not found or not owned', updated: 0 },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, updated: data.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
