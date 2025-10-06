// lib/supabase/server.ts
'use server';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type SetAllCookie = { name: string; value: string; options?: CookieOptions };

function cookieAdapter() {
  const store = cookies();

  return {
    // --- 現行 API ---
    get(name: string) {
      return store.get(name)?.value;
    },
    set(name: string, value: string, options?: CookieOptions) {
      try {
        store.set({ name, value, ...(options ?? {}) });
      } catch {
        // read-only 環境でも落ちないように
      }
    },
    remove(name: string, options?: CookieOptions) {
      try {
        store.set({ name, value: '', ...(options ?? {}), maxAge: 0 });
      } catch {
        // read-only 環境でも落ちないように
      }
    },

    // --- 互換 API（@supabase/ssr の一部バージョンが要求）---
    getAll(): { name: string; value: string }[] {
      try {
        return store.getAll().map((c) => ({ name: c.name, value: c.value }));
      } catch {
        return [];
      }
    },
    setAll(all: SetAllCookie[]) {
      try {
        for (const { name, value, options } of all ?? []) {
          store.set({ name, value, ...(options ?? {}) });
        }
      } catch {
        /* noop */
      }
    },
  };
}

/** 認証つき通常サーバールート用（Route Handlers, Server Components など） */
export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, anon, { cookies: cookieAdapter() });
}

/** （必要なら）サービスロールで使う管理クライアント */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServerClient(url, svc, { cookies: cookieAdapter() });
}

