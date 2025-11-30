// lib/supabase/client.ts
'use client';

import { supabaseClient } from '@/lib/supabase-client';

/**
 * ブラウザ用 Supabase クライアント（単一インスタンス）
 *
 * - createBrowserClient(@supabase/ssr) を使う実装は
 *   lib/supabase-client.ts にまとめてある
 * - このファイルはそれをラップして
 *   - getSupabaseClient()
 *   - getSupabaseBrowser()
 *   - supabase
 *   を提供するだけ
 *
 * 既存コード（AuthUrlHandler / LogoutButton / login まわり など）は
 * すべてここ経由でクライアントを取得する想定。
 */

const supabase = supabaseClient();

/** 互換用：ブラウザ用クライアントを返す（従来の getSupabaseClient 相当） */
export function getSupabaseClient() {
  return supabase;
}

/** 互換用：以前使っていた getSupabaseBrowser と同じ役割にする */
export function getSupabaseBrowser() {
  return supabase;
}

/** 直接 supabase を使いたい場合用 */
export { supabase };

export default supabase;

