// lib/supabase/client.ts
'use client';
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    _client = createBrowserClient(url, anon);
  }
  return _client;
}

// 互換エクスポート（既存コードでの別名呼び出しに対応）
export const getSupabaseClient = getSupabaseBrowser;
// まれにこのモジュールから直接 import している箇所向けに再エクスポート
export { createBrowserClient };

export default getSupabaseBrowser;

