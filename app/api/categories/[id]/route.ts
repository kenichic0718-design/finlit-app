// app/api/categories/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getRouteSupabase } from '@/app/_supabase/route';
import { getSupabaseAdmin } from '@/lib/supabase/server';

type Ctx = { params: { id: string } };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }

    // 1) 現在のユーザーを確認（未ログインは 401）
    const sb = getRouteSupabase();
    const {
      data: { user },
      error: userErr,
    } = await sb.auth.getUser();
    if (userErr) {
      return NextResponse.json({ ok: false, error: userErr.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2) 管理者クライアントで対象行を取得（RLSバイパス）
    const admin = getSupabaseAdmin();
    const { data: row, error: selErr } = await admin
      .from('categories')
      .select('id, profile_id')
      .eq('id', id)
      .single();

    if (selErr) {
      // 行が存在しない
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    // 所有者チェック: 別ユーザーのものは 403
    if (row.profile_id && row.profile_id !== user.id) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    // 3) 管理者クライアントで削除実行
    const { data: deletedRows, error: delErr } = await admin
      .from('categories')
      .delete()
      .eq('id', id)
      .select('id'); // 影響行数を確実に取得

    if (delErr) {
      return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
    }

    const deleted = deletedRows?.length ?? 0;
    if (deleted === 0) {
      return NextResponse.json({ ok: false, error: 'Not found', deleted }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

