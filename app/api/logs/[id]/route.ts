// app/api/logs/[id]/route.ts
import { NextResponse } from 'next/server';
import { createRouteSupabase } from '@/app/_supabase/route';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idNum = Number(params.id);
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
    }

    const sb = createRouteSupabase();
    // 認証チェック
    const { data: { user }, error: userErr } = await sb.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ ok: false, error: 'Auth session missing!' }, { status: 401 });
    }

    // 自分のレコードだけ削除（RLS があれば二重で安全）
    const { error } = await sb
      .from('logs')
      .delete()
      .eq('id', idNum)
      .eq('profile_id', user.id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}

