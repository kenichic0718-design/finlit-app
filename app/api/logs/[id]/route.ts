// app/api/logs/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRouteSupabase } from '@/app/_supabase/route';

// 単一ログ取得（必要なら）
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const sb = getRouteSupabase(cookies());
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: 'Auth session missing!' }, { status: 401 });
  }

  const { data, error } = await sb
    .from('logs')
    .select('*')
    .eq('id', Number(params.id))
    .eq('profile_id', user.id)
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: data });
}

// 更新（必要なら）
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const { amount, memo, is_income, date } = body as {
    amount?: number;
    memo?: string | null;
    is_income?: boolean;
    date?: string;
  };

  const sb = getRouteSupabase(cookies());
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: 'Auth session missing!' }, { status: 401 });
  }

  const { error } = await sb
    .from('logs')
    .update({ amount, memo, is_income, date })
    .eq('id', Number(params.id))
    .eq('profile_id', user.id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// 削除（今回の本題）
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const sb = getRouteSupabase(cookies());
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: 'Auth session missing!' }, { status: 401 });
  }

  const { error } = await sb
    .from('logs')
    .delete()
    .eq('id', Number(params.id))
    .eq('profile_id', user.id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: 1 });
}

