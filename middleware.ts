import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/log',
  '/budgets',
  '/categories',
  '/settings',
  '/goal',
  '/learn',
  '/sim',
];
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // 免除: api, 静的, auth callback, login, 画像やアセットなど
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/login') ||
    pathname === '/' // トップは公開のまま
  ) {
    return NextResponse.next();
  }

  // 対象: PROTECTED_PREFIXES に一致する場合のみ
  const needAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needAuth) return NextResponse.next();

  // Supabase の Cookie（@supabase/ssr 既定）の有無で簡易判定
  const hasAccess =
    req.cookies.has('sb-access-token') || req.cookies.has('sb:token');

  if (!hasAccess) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
export const config = {
  matcher: '/:path*',
};
