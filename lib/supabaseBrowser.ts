// lib/supabaseBrowser.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * ブラウザ用 Supabase クライアント
 *
 * - PKCE を明示してパスワードレス（Magic Link）に対応
 * - セッションはローカルストレージ＆ Cookie 経由で管理される
 */
export function supabaseBrowser() {
  return createClient<Database>(
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

