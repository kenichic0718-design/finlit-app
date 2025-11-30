// lib/supabaseClient.ts
'use client';

import { supabaseClient } from '@/lib/supabase-client';

/**
 * ブラウザ用 Supabase クライアント（単一インスタンス）
 *
 * - createBrowserClient(@supabase/ssr) を使う実装は
 *   lib/supabase-client.ts にまとめてある
 * - このファイルはそれをラップして「getSupabaseClient / supabase」
 *   という既存の呼び出し口を提供するだけ
 */

export const supabase = supabaseClient();

/** 互換用：getSupabaseClient() で同じインスタンスを返す */
export function getSupabaseClient() {
  return supabase;
}

export default supabase;

