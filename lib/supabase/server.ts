// lib/supabase/server.ts
import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Supabase 用の環境変数チェック
 *
 * - このアプリで必須なのは
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   の 2 つだけ。
 *
 * それ以外（SERVICE_ROLE など）は今回の機能では使わないので、
 * ここではチェックしません。
 */
export function envReady(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    console.error("Supabase environment variables are not fully configured");
    return false;
  }

  return true;
}

/**
 * API ルート・学習テレメトリで使う Supabase クライアント。
 *
 * 名前は admin ですが、中身はこれまでと同じ supabaseServer()
 * （= 認証付きの通常クライアント）です。
 * 既存の categories API / learn API などもこの関数をそのまま使えます。
 */
export function getSupabaseAdmin() {
  return supabaseServer();
}

/**
 * もし他の場所で getSupabaseServer を import している場合のためのエイリアス。
 */
export function getSupabaseServer() {
  return supabaseServer();
}

