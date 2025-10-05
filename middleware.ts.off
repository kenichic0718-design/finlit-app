// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // 何も書かれていないレスポンスを土台にする（ここへ Set-Cookie 等を積む）
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: CookieOptions) => {
          res.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
      headers: {
        get: (name: string) => req.headers.get(name) ?? undefined,
        set: (name: string, value: string) => res.headers.set(name, value),
      },
    }
  );

  // アクセス毎にセッションをリフレッシュして、失効間際でも延命
  await supabase.auth.getSession();

  return res;
}

// _next や静的ファイル、ヘルスチェックは除外
export const config = {
  matcher: [
    '/((?!_next|.*\\..*|api/health).*)',
  ],
};

