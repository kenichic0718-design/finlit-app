// app/auth/callback/page.tsx

import CallbackClient from "./_Client";

/**
 * Supabase のメールリンク / Magic Link から戻ってきたときのページ。
 *
 * ログイン処理の本体は Client コンポーネント側（_Client.tsx）にあり、
 * ここではそれを描画するだけにしておく。
 *
 * - URL のクエリ (?code, ?token_hash, ?error_description, ?next) は
 *   _Client 側で処理する。
 * - 古い #access_token ベースの処理はすべて廃止。
 */
export default function CallbackPage() {
  return <CallbackClient />;
}
