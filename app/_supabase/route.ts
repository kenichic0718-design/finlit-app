// app/_supabase/route.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

function makeCookieAdapter() {
  const jar = cookies();
  return {
    get(name: string) {
      return jar.get(name)?.value;
    },
    set(name: string, value: string, options?: Parameters<typeof jar.set>[2]) {
      // next/headers の cookies().set をそのまま使う
      jar.set(name, value, options);
    },
    remove(name: string, options?: Parameters<typeof jar.set>[2]) {
      // remove 相当：空＋ maxAge:0 をセット
      jar.set(name, '', { ...options, maxAge: 0 });
    },
  };
}

/** Route Handler 専用 Supabase クライアント */
export function getRouteSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, anon, { cookies: makeCookieAdapter() as any });
}

// 互換エイリアス（既存コードが getRouteClient を import しても動く）
export const getRouteClient = getRouteSupabase;

export default getRouteSupabase;

