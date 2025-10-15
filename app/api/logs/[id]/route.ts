// app/api/logs/[id]/route.ts
import { NextResponse } from 'next/server';
import { getRouteSupabase } from '@/app/_supabase/route';

function toNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  const sb = getRouteSupabase();

  const {
    data: { session },
    error: sErr,
  } = await sb.auth.getSession();
  if (sErr) return NextResponse.json({ ok: false, error: sErr.message }, { status: 500 });
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Auth session missing!' }, { status: 401 });

  const logId = Number(id);
  if (!Number.isFinite(logId)) return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });

  try {
    const { data: prof, error: pErr } = await sb
      .from('profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (pErr) throw pErr;

    if (prof?.id) {
      const { data, error } = await sb.from('logs').delete().eq('id', logId).eq('profile_id', prof.id).select('id');
      if (error) throw error;
      if (!data?.length) return NextResponse.json({ ok: false, error: 'Not found or not owned' }, { status: 404 });
      return NextResponse.json({ ok: true, deleted: data.length });
    }
    throw new Error('profile-missing');
  } catch {
    // 互換モード（所有者チェックなし）
    const { data, error } = await sb.from('logs').delete().eq('id', logId).select('id');
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, deleted: data.length, compat: true });
  }
}

// PUT/PATCH: 後方互換付き UPDATE
export async function PUT(req: Request, ctx: { params: { id: string } }) {
  return PATCH(req, ctx);
}
export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  const sb = getRouteSupabase();

  const {
    data: { session },
    error: sErr,
  } = await sb.auth.getSession();
  if (sErr) return NextResponse.json({ ok: false, error: sErr.message }, { status: 500 });
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Auth session missing!' }, { status: 401 });

  const payload = await req.json().catch(() => ({}));
  // 受け付けるフィールド（不足があってもOK）
  const amount = toNumber(payload.amount);
  const memo = typeof payload.memo === 'string' ? payload.memo : null;
  const date = typeof payload.date === 'string' ? payload.date : null;
  const is_income =
    typeof payload.is_income === 'boolean'
      ? payload.is_income
      : payload.is_income === 'true'
      ? true
      : payload.is_income === 'false'
      ? false
      : null;

  const hasAny =
    amount !== null ||
    memo !== null ||
    date !== null ||
    is_income !== null ||
    // 旧スキーマ互換（category_id を受けても無視せず更新できるなら使う）
    payload.category_id !== undefined;

  if (!hasAny) {
    return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 });
  }

  const logId = Number(id);
  if (!Number.isFinite(logId)) return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });

  const changes: Record<string, any> = {};
  if (amount !== null) changes.amount = amount;
  if (memo !== null) changes.memo = memo;
  if (date !== null) changes.date = date;
  if (is_income !== null) changes.is_income = is_income;
  if (payload.category_id !== undefined) changes.category_id = payload.category_id;

  try {
    const { data: prof, error: pErr } = await sb
      .from('profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (pErr) throw pErr;

    if (prof?.id) {
      const { data, error } = await sb.from('logs').update(changes).eq('id', logId).eq('profile_id', prof.id).select('*');
      if (error) throw error;
      if (!data?.length) return NextResponse.json({ ok: false, error: 'Not found or not owned' }, { status: 404 });
      return NextResponse.json({ ok: true, item: data[0] });
    }
    throw new Error('profile-missing');
  } catch {
    // 互換モード（所有者チェックなし）
    const { data, error } = await sb.from('logs').update(changes).eq('id', logId).select('*');
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, item: data[0], compat: true });
  }
}

