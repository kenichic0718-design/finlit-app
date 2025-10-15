// app/api/logs/[id]/route.ts
import { NextResponse } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';

type PatchBody = Partial<{
  amount: number | string;
  memo: string | null;
  date: string;        // 'YYYY-MM-DD'
  is_income: boolean;
  category_id: string | null;
}>;

/**
 * 共通: 現在のユーザーを取得
 */
async function requireUser() {
  const supabase = getRouteClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return { supabase, user: null as any, res: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  return { supabase, user: data.user, res: null as any };
}

/**
 * 指定 id の log が、現在ユーザーのものかを inner join で検証して取得
 *  - logs.profile_id -> profiles.id（FK 前提）
 *  - profiles.user_id == user.id
 */
async function getOwnedLog(supabase: ReturnType<typeof getRouteClient>, id: string, userId: string) {
  const { data, error } = await supabase
    .from('logs')
    .select('id, amount, memo, date, is_income, category_id, profile_id, profiles!inner(user_id)')
    .eq('id', id)
    .eq('profiles.user_id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { supabase, user, res } = await requireUser();
  if (!user) return res;

  // 所有チェック
  const owned = await getOwnedLog(supabase, params.id, user.id);
  if (!owned) {
    return NextResponse.json({ ok: false, error: 'Not found or not owned' }, { status: 404 });
  }

  const { error: delErr } = await supabase.from('logs').delete().eq('id', params.id);
  if (delErr) {
    return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: 1 });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { supabase, user, res } = await requireUser();
  if (!user) return res;

  // 所有チェック
  const owned = await getOwnedLog(supabase, params.id, user.id);
  if (!owned) {
    return NextResponse.json({ ok: false, error: 'Not found or not owned' }, { status: 404 });
  }

  const body: PatchBody = await req.json();

  // 受け付けるフィールドだけ反映（最小限）
  const update: Record<string, any> = {};
  if (body.amount !== undefined) update.amount = Number(body.amount);
  if (body.memo !== undefined) update.memo = body.memo ?? null;
  if (body.date !== undefined) update.date = body.date; // 形式は UI 側で 'YYYY-MM-DD'
  if (body.is_income !== undefined) update.is_income = !!body.is_income;
  if (body.category_id !== undefined) update.category_id = body.category_id;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid fields' }, { status: 400 });
  }

  const { error: upErr } = await supabase.from('logs').update(update).eq('id', params.id);
  if (upErr) {
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
  }

  // 更新後の 1 行を返す（UI の即時反映用）
  const { data: updated, error: selErr } = await supabase
    .from('logs')
    .select('id, amount, memo, date, is_income, category_id')
    .eq('id', params.id)
    .single();

  if (selErr || !updated) {
    return NextResponse.json({ ok: true, updated: 1 }); // 最悪でも OK を返す
  }

  return NextResponse.json({ ok: true, item: updated });
}

