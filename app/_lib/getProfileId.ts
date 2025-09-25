'use server';

import { createClient } from '@/app/_supabase/server';

/**
 * 現在ログイン中ユーザーの profile_id を返す。
 * なければ作成してから返す。
 *
 * 返り値:
 *   - string: profile_id
 *   - null  : 未ログイン
 */
export async function getProfileId(): Promise<string | null> {
  const supabase = await createClient();

  // 1) ログイン確認
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 2) 既存の profiles を探す
  const { data: existing, error: selErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (selErr) {
    console.error(selErr);
  }
  if (existing?.id) return existing.id;

  // 3) なければ作成（RLSで許可が必要）
  const { data: inserted, error: insErr } = await supabase
    .from('profiles')
    .insert({ user_id: user.id })          // 必要に応じて初期値を追加
    .select('id')
    .single();

  if (insErr) {
    console.error(insErr);
    throw insErr; // ここで失敗する場合は RLS の許可が不足
  }
  return inserted.id;
}

