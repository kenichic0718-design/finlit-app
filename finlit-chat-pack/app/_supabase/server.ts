// app/_supabase/server.ts
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // 存在チェック用
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function envReady() {
  return Boolean(url && anon && service);
}

let _admin: SupabaseClient | null = null;

/** サービスロールの管理クライアント（サーバー専用 / RLSバイパス） */
export function getSupabaseAdmin(): SupabaseClient {
  if (!envReady()) throw new Error('Supabase environment variables are not ready.');
  if (_admin) return _admin;

  _admin = createServiceClient(url, service, {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'finlit-admin' } },
  });
  return _admin;
}
