// app/_supabase/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Route Handler 専用のSupabaseクライアント
 * Next.jsの cookies() を get/set/remove ラッパで渡す（公式推奨）
 */
export function getRouteClient() {
  const store = cookies();

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options?: Parameters<typeof store.set>[1]) {
        store.set(name, value, options);
      },
      remove(name: string, options?: Parameters<typeof store.set>[1]) {
        store.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });
}

