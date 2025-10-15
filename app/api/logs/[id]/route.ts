// app/api/logs/[id]/route.ts
import { NextResponse } from 'next/server';
import { getRouteClient } from '@/app/_supabase/route';
import { createClient } from '@supabase/supabase-js';

type Params = { params: { id: string } };

// 管理者クライアント（RLSを回避。必ずサーバーだけで使用）
function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const supa = getRouteClient();

    // 認証ユーザー（Cookie）
    const { data: auth, error: authErr } = await supa.auth.getUser();
    if (authErr || !auth?.user) {
      return NextResponse.json(
        { ok: false, error: 'Auth session missing!' },
        { status: 401 }
      );
    }

    // id バリデーション
    const idNum = Number(params.id);
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
    }

    // まず管理者で存在＆所有者チェック
    const admin = getAdmin();
    const { data: row, error: selErr } = await admin
      .from('logs')
      .select('id, profile_id')
      .eq('id', idNum)
      .single();

    if (selErr) {
      return NextResponse.json({ ok: false, error: selErr.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }
    if (row.profile_id !== auth.user.id) {
      // 他人のデータは削除不可
      return NextResponse.json({ ok: false, error: 'Not found or not owned' }, { status: 404 });
    }

    // 所有者確認できたので管理者権限で確実に削除
    const { error: delErr } = await admin.from('logs').delete().eq('id', idNum).limit(1);
    if (delErr) {
      return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: idNum });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

