// app/api/logs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';

// 共通: 認証ユーザー→profiles.id を取得
async function getProfileIdOr401() {
  const sb = getRouteClient();
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    return { error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  // profiles.id を取得（profiles.user_id = auth.users.id）
  const { data: profile, error: pErr } = await sb
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (pErr || !profile) {
    return { error: NextResponse.json({ ok: false, error: 'Profile not found for user' }, { status: 401 }) };
  }

  return { sb, profileId: profile.id as string };
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { sb, profileId, error } = await getProfileIdOr401();
  if (error) return error;

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
  }

  // 自分のレコードだけ削除
  const { error: delErr, count } = await sb
    .from('logs')
    .delete({ count: 'exact' })
    .eq('id', idNum)
    .eq('profile_id', profileId);

  if (delErr) {
    return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  }
  if (!count) {
    return NextResponse.json({ ok: false, error: 'Not found or not owned', deleted: 0 }, { status: 404 });
  }
  return NextResponse.json({ ok: true, deleted: count });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { sb, profileId, error } = await getProfileIdOr401();
  if (error) return error;

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  // 受け取り可能な項目だけ反映（存在するキーのみ）
  const update: Record<string, any> = {};
  if (typeof payload.amount === 'number') update.amount = payload.amount;
  if (typeof payload.memo === 'string') update.memo = payload.memo;
  if (typeof payload.is_income === 'boolean') update.is_income = payload.is_income;
  if (typeof payload.date === 'string') update.date = payload.date; // 'YYYY-MM-DD'

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: 'No updatable fields' }, { status: 400 });
  }

  // 自分のレコードだけ更新
  const { data, error: upErr } = await sb
    .from('logs')
    .update(update)
    .eq('id', idNum)
    .eq('profile_id', profileId)
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

