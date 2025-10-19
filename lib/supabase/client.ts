k// lib/supabase/client.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(url, key, {
    cookieOptions: { name: 'sb', lifetime: 60 * 60 * 24 * 365 },
  });
}

// 互換エイリアス（過去コードが getSupabaseBrowser を import していても動くように）
export const getSupabaseBrowser = getSupabaseClient;

