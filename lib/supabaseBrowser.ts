// lib/supabaseBrowser.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * ブラウザ用 Supabase クライアント（PKCE を明示的に使用）
 *
 * - 本番環境では createBrowserClient のデフォルトが implicit になることがあり、
 *   その場合、Magic Link から /auth/callback?code=... にリダイレクトされず
 *   /auth/callback で code が取れない → ログインループ の原因になる。
 *
 * - flowType: "pkce" を明示することで、メールリンクに code が付き、
 *   app/auth/callback/route.ts の exchangeCodeForSession と整合する。
 */
export function supabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );
}

