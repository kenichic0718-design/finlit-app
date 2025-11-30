'use client';

import { createBrowserClient, CookieOptions } from '@supabase/ssr';

let singleton:
  | ReturnType<typeof createBrowserClient>
  | null = null;

/** アプリ全体で唯一のブラウザクライアント（Multiple GoTrueClient防止） */
export function createSupabaseBrowser() {
  if (singleton) return singleton;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  singleton = createBrowserClient(url, key, {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined;
        const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
        return match ? decodeURIComponent(match.pop() as string) : undefined;
      },
      set(name: string, value: string, options: CookieOptions) {
        if (typeof document === 'undefined') return;
        const opt: CookieOptions = {
          path: '/',
          sameSite: 'lax',
          ...options,
        };
        let cookie = `${name}=${encodeURIComponent(value)}; Path=${opt.path}; SameSite=${opt.sameSite}`;
        if (opt.maxAge) cookie += `; Max-Age=${opt.maxAge}`;
        if (opt.expires) cookie += `; Expires=${opt.expires.toUTCString()}`;
        if (opt.domain) cookie += `; Domain=${opt.domain}`;
        if (opt.secure) cookie += `; Secure`;
        document.cookie = cookie;
      },
      remove(name: string, options: CookieOptions) {
        if (typeof document === 'undefined') return;
        document.cookie = `${name}=; Path=${options.path ?? '/'}; Max-Age=0`;
      },
    },
  });

  return singleton;
}

