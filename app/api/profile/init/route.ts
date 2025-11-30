// app/api/profile/init/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

const DEFAULT_EXPENSE = ['家賃', '光熱費', '通信費', 'サブスク', '食費', '日用品・消耗品', '交通・移動', '交際・娯楽', '勉強・自己投資', 'その他'];
const DEFAULT_INCOME  = ['アルバイト・給与', '仕送り', '奨学金', 'その他収入'];

type Json = Record<string, unknown>;

function ok(body: Json, init?: number) {
  return NextResponse.json(body, { status: init ?? 200 });
}
function bad(message: string, hint?: Json) {
  return NextResponse.json({ error: message, ...(hint ?? {}) }, { status: 400 });
}
function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function POST() {
  const supabase = getSupabaseServer();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    return bad('auth.getUser failed', { detail: userErr.message });
  }
  if (!user) {
    return unauthorized();
  }

  // profiles の存在確認
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (profErr) return bad('profiles check failed', { detail: profErr.message });

  if (!profile) {
    // プロファイルがない場合は作成
    const { error: insProfErr } = await supabase.from('profiles').insert({
      id: user.id,
    });
    if (insProfErr) {
      return bad('profiles insert failed', { detail: insProfErr.message });
    }
  }

  // categories の存在確認
  const { data: anyCat, error: catCheckErr } = await supabase
    .from('categories')
    .select('id')
    .eq('profile_id', user.id)
    .limit(1);

  if (catCheckErr) return bad('categories check failed', { detail: catCheckErr.message });

  let created = 0;

  if (!anyCat || anyCat.length === 0) {
    // デフォカテゴリを投入（positionは1000,1010,...）
    const rows: any[] = [];
    let pos = 1000;
    for (const name of DEFAULT_EXPENSE) {
      rows.push({ profile_id: user.id, name, kind: 'expense', position: pos });
      pos += 10;
    }
    for (const name of DEFAULT_INCOME) {
      rows.push({ profile_id: user.id, name, kind: 'income', position: pos });
      pos += 10;
    }

    const { data: insCats, error: insCatErr } = await supabase
      .from('categories')
      .insert(rows)
      .select('id');

    if (insCatErr) {
      // 一意制約競合などは“すでに入っていた”とみなしてOK扱いに落とす
      if ((insCatErr as any)?.code === '23505') {
        return ok({ ok: true, createdCategories: 0, note: 'already exists (unique violation)' });
      }
      return bad('categories insert failed', { detail: insCatErr.message });
    }
    created = insCats?.length ?? 0;
  }

  return ok({ ok: true, createdCategories: created });
}

