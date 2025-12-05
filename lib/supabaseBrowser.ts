// lib/supabaseBrowser.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * ブラウザ用 Supabase クライアント
 *
 * - detectSessionInUrl: true により、/auth/callback で URL フラグメント
 *   （#access_token=... など）から自動的にセッションを復元する。
 * - これを前提に app/auth/callback/page.tsx では getSession() を
 *   一度呼び出すだけにしている。
 */
export function supabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );
}

