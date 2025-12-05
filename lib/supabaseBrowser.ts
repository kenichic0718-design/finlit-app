// lib/supabaseBrowser.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * ブラウザ用 Supabase クライアント
 *
 * - flowType: "pkce" を明示して、メールリンクに ?code=... を付ける
 * - detectSessionInUrl: true で、フロント側も URL からセッションを検出
 * - Cookie 形式は supabaseServer.ts と同じ (@supabase/ssr) 系列で統一
 */
export function supabaseBrowser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

