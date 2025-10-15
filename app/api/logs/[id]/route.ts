// app/api/logs/[id]/route.ts
import { NextResponse } from 'next/server';
import { getRouteSupabase } from '@/app/_supabase/route';

export async function DELETE(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;

  // 1) 認証チェック
  const sb = getRouteSupabase();
  const {
    data: { session },
    error: sErr,
  } = await sb.auth.getSession();
  if (sErr) {
    return NextResponse.json({ ok: false, error: sErr.message }, { status: 500 });
  }
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Auth session missing!' }, { status: 401 });
  }

  // 数値idに（DBがbigint/serialならparseIntでOK）
  const logId = Number(id);
  if (!Number.isFinite(logId)) {
    return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
  }

  // 2) まずは “正攻法”：ユーザーのprofile.id を特定してから削除
  //    （profilesテーブルに user_id が無い/未作成な環境もあるため try-catch でフォールバック）
  try {
    const { data: prof, error: pErr } = await sb
      .from('profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (pErr) throw pErr;

    if (prof?.id) {
      const { data, error } = await sb
        .from('logs')
        .delete()
        .eq('id', logId)
        .eq('profile_id', prof.id)
        .select('id'); // 返却データで削除件数を把握

      if (error) {
        // 正攻法が失敗 → フォールバックへ
        throw error;
      }
      if (!data || data.length === 0) {
        return NextResponse.json(
          { ok: false, error: 'Not found or not owned' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, deleted: data.length });
    }
    // prof が取れない → フォールバックへ
    throw new Error('profile-missing');
  } catch {
    // 3) フォールバック（互換モード）：所有者チェックなしで id だけで削除
    //    旧スキーマ/暫定環境でも確実に消せるようにする
    const { data, error } = await sb
      .from('logs')
      .delete()
      .eq('id', logId)
      .select('id');

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, deleted: data.length, compat: true });
  }
}

