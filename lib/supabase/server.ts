// lib/supabase/server.ts
import 'server-only';

import { cookies } from 'next/headers';
import {
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr';
import {
  createClient as createAdminClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

/** Env */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * サーバー側 Supabase クライアント（Cookie と連携）
 * - Next.js App Router で cookies() を使って SSRedge/Server 向けに最適化
 */
export function getSupabaseServer(): SupabaseClient {
  const store = cookies();

  const cookieAdapter = {
    get(name: string) {
      return store.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions) {
      store.set({ name, value, ...options });
    },
    remove(name: string, options: CookieOptions) {
      // set + maxAge=0 で削除相当
      store.set({ name, value: '', ...options, maxAge: 0 });
    },
  };

  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: () => cookieAdapter,
  });
}

/** 現在のセッションを取得（なければ null） */
export async function getAuthSession() {
  const supabase = getSupabaseServer();
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/** 現在のユーザーを取得（なければ null） */
export async function getCurrentUser() {
  const supabase = getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/* ===========================
 *  互換: 既存APIから参照されるヘルパー
 * ===========================*/

/** 旧実装互換: 必要なenvがそろっているか簡易チェック */
export function envReady(
  requireKeys: Array<'url' | 'anon' | 'service'> = ['url', 'anon']
): boolean {
  const hasUrl = !!SUPABASE_URL;
  const hasAnon = !!SUPABASE_ANON;
  const hasService = !!SUPABASE_SERVICE;
  return (
    (!requireKeys.includes('url') || hasUrl) &&
    (!requireKeys.includes('anon') || hasAnon) &&
    (!requireKeys.includes('service') || hasService)
  );
}

/** 旧実装互換: サービスロールクライアント */
export function getSupabaseAdmin(): SupabaseClient {
  if (!SUPABASE_SERVICE) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return createAdminClient(SUPABASE_URL, SUPABASE_SERVICE);
}

export type ServerSupabase = ReturnType<typeof getSupabaseServer>;

