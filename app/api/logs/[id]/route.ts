// app/api/logs/[id]/route.ts
import { NextResponse } from 'next/server';
import { getRouteSupabase } from '@/app/_supabase/route';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sb = getRouteSupabase();

    // 認証チェック
    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: 'Auth session missing!' },
        { status: 401 }
      );
    }

    // id バリデーション
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid log id' },
        { status: 400 }
      );
    }

    // 自分の行だけ削除（RLS: profile_id = auth.uid() 前提）
    const { error } = await sb
      .from('logs')
      .delete()
      .eq('id', id)
      .eq('profile_id', user.id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
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
      return NextResponse.json(
        { ok: false, error: 'Invalid log id' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const memo = (body.memo ?? null) as string | null;

    if (!Number.isFinite(amount)) {
      return NextResponse.json(
        { ok: false, error: 'amount must be a number' },
        { status: 400 }
      );
    }

    const { error } = await sb
      .from('logs')
      .update({ amount, memo })
      .eq('id', id)
      .eq('profile_id', user.id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

