// lib/supabaseBrowser.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * ブラウザ用 Supabase クライアント
 *
 * - デフォルトの implicit フロー + detectSessionInUrl をそのまま利用する
 * - メールマジックリンクで /auth/callback に戻ったとき、
 *   createBrowserClient の初期化時に URL ハッシュを検出して
 *   自動的にセッションを保存してくれる
 */
export function supabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

