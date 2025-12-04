// middleware.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Supabase の Magic Link / OTP から戻ってきたときの
 * `code` 付き URL を `/auth/callback` に集約するためのミドルウェア。
 *
 * それ以外の処理（認可ガードなど）は各ページ側の実装に任せ、
 * ここでは一切行わない。
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Supabase からの戻りで `code` or `error_description` が付いている場合、
  // どのパスに来ても `/auth/callback` に集約する。
  const hasCode = url.searchParams.get("code");
  const hasError = url.searchParams.get("error_description");

  if ((hasCode || hasError) && pathname !== "/auth/callback") {
    const redirectUrl = new URL("/auth/callback", req.url);
    redirectUrl.search = url.search; // クエリをそのまま引き継ぐ
    return NextResponse.redirect(redirectUrl);
  }

  // それ以外は何もせず素通り
  return NextResponse.next();
}

// _next や static, api などにはミドルウェアを適用しない
export const config = {
  matcher: ["/((?!_next/|static/|favicon.ico).*)"],
};

