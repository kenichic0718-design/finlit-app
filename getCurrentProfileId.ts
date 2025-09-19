'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * 現在ログイン中のユーザーの profile_id を取得
 * - Supabase Auth の user.id を visitor_id として users テーブルを参照
 * - 該当行がない/未ログインならエラーを投げます
 */
export async function getCurrentProfileId(supabase?: ReturnType<typeof createClientComponentClient>): Promise<string> {
  const sb = supabase ?? createClientComponentClient();

  // 認証ユーザー取得
  const { data: auth, error: authError } = await sb.auth.getUser();
  if (authError) throw new Error(`auth.getUser error: ${authError.message}`);
  if (!auth?.user) throw new Error('未ログインのため profile_id を取得できません');

  // users(visitor_id -> profile_id) を引く
  const { data, error } = await sb
    .from('users')
    .select('profile_id')
    .eq('visitor_id', auth.user.id)
    .maybeSingle();

  if (error) throw new Error(`users 参照時エラー: ${error.message}`);
  if (!data?.profile_id) throw new Error('users に profile_id が見つかりません');

  return data.profile_id;
}

