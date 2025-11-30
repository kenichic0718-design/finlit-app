// app/_utils/getCurrentProfileId.ts
import 'server-only';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * 今ログインしているユーザーの profile_id を取得する。
 * - profiles.id は auth.users.id と同じ UUID 前提（以前作ったテーブル定義どおり）
 * - 見つからなければ null を返す
 */
export async function getCurrentProfileId(): Promise<string | null> {
  const supabase = supabaseServer();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('[getCurrentProfileId] auth.getUser error', error);
    return null;
  }

  if (!user) {
    console.warn('[getCurrentProfileId] no user');
    return null;
  }

  // profiles.id = auth.users.id なので、そのまま profile_id として扱う
  return user.id;
}

