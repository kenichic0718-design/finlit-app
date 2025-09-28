// app/_supabase/client.ts（置換）
"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
export function getSupabaseClient() {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,   // 同端末で継続
        autoRefreshToken: true, // 自動更新
        detectSessionInUrl: true,
      },
    }
  );
  return _client;
}

