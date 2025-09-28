// app/_supabase/server.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

/** Edge/Node どちらでも動くサーバー用クライアント */
export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const store = cookies();

  return createServerClient(url, anon, {
    cookies: {
      get(name) {
        return store.get(name)?.value;
      },
      set(name, value, options) {
        // Vercel Edge/Node で動く書き方
        try {
          store.set({ name, value, ...options });
        } catch {
          // no-op（ビルド時など cookies が書けない環境向け）
        }
      },
      remove(name, options) {
        try {
          store.set({ name, value: '', ...options, maxAge: 0 });
        } catch {}
      },
    },
  });
}

/** 管理者操作が必要なとき用（RLSを回避して profiles を作るなど） */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !service) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');

  return createSupabaseClient(url, service);
}

/** プロフィール行が無ければ upsert するユーティリティ（APIから呼び出し想定） */
export async function ensureProfile(userId: string) {
  const admin = getSupabaseAdmin();
  await admin.from('profiles').upsert({ id: userId }, { onConflict: 'id' });
}

/** env チェック用の簡易関数（エラーメッセージ短縮） */
export function envReady() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase env not ready');
  }
}

