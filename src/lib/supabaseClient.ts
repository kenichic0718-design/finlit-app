// src/lib/supabaseClient.ts
// ブラウザ／クライアント用の統一 Supabase クライアント（シングルトン）

import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
  // HMRでもインスタンスを使い回せるように global に保持
  // eslint-disable-next-line no-var
  var __supabase__: SupabaseClient | undefined;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 動作チェック用に先頭数文字だけログ出ししたいとき：
// console.log('[supabase] url =', url, 'anonHead =', anon?.slice(0, 6));

if (!url || !anon) {
  // 環境変数が埋まっていないケースを早期に検知
  throw new Error('Supabase env is missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase: SupabaseClient =
  globalThis.__supabase__ ??
  createClient(url, anon, {
    auth: {
      persistSession: false, // 今回は匿名キーのみ利用なので cookie セッションは保持しない
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__supabase__ = supabase;
}

