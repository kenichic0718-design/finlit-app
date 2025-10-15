// app/api/logs/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getRouteSupabase } from '@/app/_supabase/route';

// 共通: セッション & プロフィールを取る
async function getAuthedProfile(supabase: ReturnType<typeof getRouteSupabase>) {
  const { data: { session }, error: sErr } = await supabase.auth.getSession();
  if (sErr) return { status: 500, json: { ok: false, error: sErr.message } as const };
  if (!session) return { status: 401, json: { ok: false, error: 'Unauthorized' } as const };

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', session.user.id)
    .single();

  if (pErr || !profile) {
    return { status: 401, json: { ok: false, error: 'Profile not found for user' } as const };
  }
  return { status: 200, profile };
}

// ログの所有チェック
async function assertOwnLog(supabase: ReturnType<typeof getRouteSupabase>, id: string, profileId: string) {
  const { data: row, error } = await supabase
    .from('logs')
    .select('id, profile_id')
    .eq('id', id)
    .single();

  if (error) return { status: 404, json: { ok: false, error: 'Not found' } as const };
  if (!row || row.profile_id !== profileId) {
    return { status: 404, json: { ok: false, error: 'Not found or not owned' } as const };
  }
  return { status: 200 };
}

// PATCH /api/logs/:id  — 部分更新（amount, memo, date, is_income, category_id を許可）
export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  const supabase = getRouteSupabase(req);

  const prof = await getAuthedProfile(supabase);
  if ('json' in prof) return NextResponse.json(prof.json, { status: prof.status });

  const own = await assertOwnLog(supabase, id, prof.profile.id);
  if ('json' in own) return NextResponse.json(own.json, { status: own.status });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  // 受け付けるキーだけ通す（不要キーは落とす）
  const allowedKeys = ['amount', 'memo', 'date', 'is_income', 'category_id'] as const;
  const update: Record<string, unknown> = {};
  for (const k of allowedKeys) {
    if (k in body) update[k] = body[k];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: 'No updatable fields' }, { status: 400 });
  }

  const { data: updated, error: uErr } = await supabase
    .from('logs')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (uErr) {
    return NextResponse.json({ ok: false, error: uErr.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, item: updated }, { status: 200 });
}

// DELETE /api/logs/:id  — 既存の削除が動いていればそのままでOK。念のため置いておきます。
export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  const supabase = getRouteSupabase(req);

  const prof = await getAuthedProfile(supabase);
  if ('json' in prof) return NextResponse.json(prof.json, { status: prof.status });

  const own = await assertOwnLog(supabase, id, prof.profile.id);
  if ('json' in own) return NextResponse.json(own.json, { status: own.status });

  const { error, count } = await supabase.from('logs').delete({ count: 'exact' }).eq('id', id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, deleted: count ?? 0 }, { status: 200 });
}

