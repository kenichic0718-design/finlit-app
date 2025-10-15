// app/api/logs/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';

type Params = { params: { id: string } };

// 共通: 現在ログイン中ユーザーの profile_id を取る
async function getCurrentProfileId() {
  const sb = getRouteClient();
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    return { error: 'Auth session missing!', profileId: null as string | null };
  }

  const { data: prof, error: profErr } = await sb
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profErr || !prof?.id) {
    return { error: 'Profile not found for user', profileId: null as string | null };
  }
  return { error: null, profileId: prof.id as string };
}

// DELETE /api/logs/:id  行を自分のprofile_idに紐づくものだけ削除
export async function DELETE(_req: NextRequest, { params }: Params) {
  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
  }

  const { error, profileId } = await getCurrentProfileId();
  if (error) return NextResponse.json({ ok: false, error }, { status: 401 });

  const sb = getRouteClient();

  // まず所有チェック（存在しなければ404）
  const { data: existing, error: selErr } = await sb
    .from('logs')
    .select('id, profile_id')
    .eq('id', idNum)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json({ ok: false, error: selErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: 'Not found or not owned' },
      { status: 404 }
    );
  }

  // 削除（returning したいので select() をぶら下げる）
  const { error: delErr } = await sb
    .from('logs')
    .delete()
    .eq('id', idNum)
    .eq('profile_id', profileId);

  if (delErr) {
    return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: 1 });
}

// PATCH /api/logs/:id  最小限の編集（amount, memo, is_income, date）
export async function PATCH(req: NextRequest, { params }: Params) {
  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const upd: Record<string, unknown> = {};
  if (typeof body.amount === 'number') upd.amount = body.amount;
  if (typeof body.memo === 'string' || body.memo === null) upd.memo = body.memo;
  if (typeof body.is_income === 'boolean') upd.is_income = body.is_income;
  if (typeof body.date === 'string') upd.date = body.date;

  if (Object.keys(upd).length === 0) {
    return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 });
  }

  const { error, profileId } = await getCurrentProfileId();
  if (error) return NextResponse.json({ ok: false, error }, { status: 401 });

  const sb = getRouteClient();

  // 所有チェック
  const { data: existing, error: selErr } = await sb
    .from('logs')
    .select('id')
    .eq('id', idNum)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json({ ok: false, error: selErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: 'Not found or not owned' },
      { status: 404 }
    );
  }

  const { error: updErr } = await sb
    .from('logs')
    .update(upd)
    .eq('id', idNum)
    .eq('profile_id', profileId);

  if (updErr) {
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

