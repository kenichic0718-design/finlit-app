// lib/supabase/server.ts
import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const envReady =
  Boolean(URL) && Boolean(ANON);

export function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
}

// 管理APIが必要な場合のみ使用（RLSを超える処理）
export function getSupabaseAdmin() {
  if (!SVC) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createAdminClient(URL, SVC);
}

