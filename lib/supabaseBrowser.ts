// lib/supabaseBrowser.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * ブラウザ用 Supabase クライアント
 *
 * - @supabase/ssr の createBrowserClient を使うことで、
 *   サーバ側の createServerClient と Cookie ベースでセッションを共有する。
 * - flowType や Cookie 設定は SSR 推奨のデフォルトに任せる。
 */
export function supabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

