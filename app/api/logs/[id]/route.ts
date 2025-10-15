// app/api/logs/[id]/route.ts
import { NextResponse } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';

type Params = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const supa = getRouteClient();

  // 認証ユーザー取得（Cookie ベース）
  const { data: auth, error: authErr } = await supa.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json(
      { ok: false, error: 'Auth session missing!' },
      { status: 401 }
    );
  }

  // id バリデーション（数値のみ許可）
  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid id' },
      { status: 400 }
    );
  }

  // 自分のレコードだけ削除（RLS考慮）
  const { data, error } = await supa
    .from('logs')
    .delete()
    .eq('id', idNum)
    .eq('profile_id', auth.user.id)
    .select('id') // ← 削除件数判定のため返してもらう
    .limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Not found or not owned' },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, id: idNum });
}

