// app/api/logs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';

export const dynamic = 'force-dynamic';

/** 共通: 認証済みユーザーを要求（未ログインなら 401 を返す） */
async function requireUser() {
  const sb = getRouteClient();
  const { data: { user }, error } = await sb.auth.getUser();
  return { sb, user, error };
}

/** DELETE /api/logs/[id] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { sb, user, error } = await requireUser();
  if (error || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
  }

  // 所有権は RLS が保証。id のみで削除を試みる
  const { data, error: delErr } = await sb
    .from('logs')
    .delete()
    .eq('id', idNum)
    .select()
    .maybeSingle();

  if (delErr) {
    return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  }
  if (!data) {
    // RLS で弾かれた or そもそも存在しない
    return NextResponse.json({ ok: false, error: 'Not found or not owned' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, deleted: 1 });
}

/** PATCH /api/logs/[id]  — amount/memo/is_income/date のいずれかを更新 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { sb, user, error } = await requireUser();
  if (error || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const update: Record<string, any> = {};
  if (typeof body.amount === 'number') update.amount = body.amount;
  if (typeof body.memo === 'string') update.memo = body.memo;
  if (typeof body.is_income === 'boolean') update.is_income = body.is_income;
  if (typeof body.date === 'string') update.date = body.date;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: 'No updatable fields' }, { status: 400 });
  }

  // RLS に任せて id のみで更新
  const { data, error: upErr } = await sb
    .from('logs')
    .update(update)
    .eq('id', idNum)
    .select()
    .maybeSingle();

  if (upErr) {
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: data });
}

