// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Supabase のセッションを見て、
 * - 未ログインで保護ページ → /login へ
 * - ログイン済みで /login → next or /
 * を制御する middleware。
 *
 * Cookie の get/set は @supabase/ssr 公式のパターンに沿って実装。
 */
export async function middleware(req: NextRequest) {
  // Cookie 書き戻し用のレスポンス（ヘッダを引き継ぐ）
  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // middleware 用の Supabase Client（Cookie アダプタ付き）
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // middleware では res.cookies.set が公式に許可されている
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        res.cookies.set({
          name,
          value: '',
          ...options,
          maxAge: 0,
        });
      },
    },
  });

  // 認証済みユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  // ログインページと callback は常に許可
  const isPublic =
    path.startsWith('/login') ||
    path.startsWith('/auth/callback');

  // 未ログインで保護ページ → /login へ
  if (!user && !isPublic) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  // ログイン済みで /login → next へ
  if (user && path.startsWith('/login')) {
    const dest = req.nextUrl.searchParams.get('next') || '/';
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // それ以外は普通に続行（Cookie 更新は res 側に反映される）
  return res;
}

// matcher（これが最重要）
export const config = {
  matcher: [
    // 静的ファイル & API & callback は完全除外
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.webmanifest|icons|images|api|auth/callback).*)',
  ],
};

