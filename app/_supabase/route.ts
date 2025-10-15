// app/_supabase/route.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function getRouteSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const store = cookies();

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, opts: { path?: string; maxAge?: number; domain?: string; sameSite?: 'lax'|'strict'|'none'; secure?: boolean; httpOnly?: boolean }) {
        store.set({ name, value, ...opts });
      },
      remove(name: string, opts?: { path?: string; domain?: string }) {
        store.delete({ name, ...opts });
      },
    },
  });
}

