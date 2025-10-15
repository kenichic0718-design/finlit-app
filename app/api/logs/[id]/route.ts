// app/api/logs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';

// 便利レスポンダ
const json = (body: any, init?: number | ResponseInit) =>
  new NextResponse(JSON.stringify(body), {
    ...(typeof init === 'number' ? { status: init } : init),
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

type Params = { params: { id: string } };

// 共通：ユーザーとプロフィール取得
async function getUserAndProfile() {
  const supabase = getRouteClient();

  const { data: u, error: uerr } = await supabase.auth.getUser();
  if (uerr || !u?.user) return { error: json({ ok: false, error: 'Unauthorized' }, 401) };

  const { data: profile, error: perr } = await supabase
    .from('profiles')
    .select('id,user_id')
    .eq('user_id', u.user.id)
    .maybeSingle();

  if (perr) return { error: json({ ok: false, error: perr.message }, 500) };
  if (!profile) return { error: json({ ok: false, error: 'Profile not found for user' }, 401) };

  return { supabase, user: u.user, profile };
}

// -------------------------
// PATCH /api/logs/:id
// -------------------------
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const id = params.id;
    if (!id) return json({ ok: false, error: 'Missing id' }, 400);

    const got = await getUserAndProfile();
    if ('error' in got) return got.error;
    const { supabase, profile } = got;

    // 受信JSON（差分のみでOK）
    const body = await req.json().catch(() => ({}));

    // 更新可能なカラムだけ許可
    const patch: Record<string, any> = {};
    if (body.date !== undefined) patch.date = body.date;                 // 'YYYY-MM-DD'
    if (body.amount !== undefined) patch.amount = Number(body.amount);   // number
    if (body.memo !== undefined) patch.memo = body.memo ?? null;         // string|null
    if (body.is_income !== undefined) patch.is_income = !!body.is_income;// boolean
    if (body.category_id !== undefined)
      patch.category_id = body.category_id ?? null;                      // uuid|null

    if (Object.keys(patch).length === 0) {
      return json({ ok: false, error: 'No updatable fields' }, 400);
    }

    // 所有チェックもWhereで担保（RLSも効いて二重の安全）
    const { data, error } = await supabase
      .from('logs')
      .update(patch)
      .eq('id', id)
      .eq('profile_id', profile.id)
      .select('id, profile_id, date, amount, memo, is_income, category_id')
      .maybeSingle();

    if (error) return json({ ok: false, error: error.message }, 500);
    if (!data) return json({ ok: false, error: 'Not found or not owned' }, 404);

    return json({ ok: true, item: data }, 200);
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? 'Unexpected error' }, 500);
  }
}

// 既に実装済みならこのDELETEはそのままでOKですが、参考として残します。
// DELETE /api/logs/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const id = params.id;
    if (!id) return json({ ok: false, error: 'Missing id' }, 400);

    const got = await getUserAndProfile();
    if ('error' in got) return got.error;
    const { supabase, profile } = got;

    const { data, error } = await supabase
      .from('logs')
      .delete()
      .eq('id', id)
      .eq('profile_id', profile.id)
      .select('id')
      .maybeSingle();

    if (error) return json({ ok: false, error: error.message }, 500);
    if (!data) return json({ ok: false, error: 'Not found or not owned' }, 404);

    return json({ ok: true, deleted: 1 });
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? 'Unexpected error' }, 500);
  }
}

