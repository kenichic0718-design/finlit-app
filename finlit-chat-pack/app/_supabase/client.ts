// app/_supabase/client.ts
'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/** ブラウザから使う読み取り主体のクライアント（Singleton） */
export function getSupabaseBrowser(): SupabaseClient {
  if (_client) return _client;

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  _client = createClient(url, anon, {
    auth: { persistSession: true }, // GoTrue session をブラウザに1つだけ持たせる
    global: { headers: { 'X-Client-Info': 'finlit-web' } },
  });
  return _client;
}

