// middleware.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * 2025-12 対応:
 * FinLit PWA では、Supabase の Magic Link / OTP の redirectTo を
 * すべて `/auth/callback` に向けているため、
 * middleware 側で `code` や `error_description` を見て
 * 強制的に `/auth/callback` へリダイレクトする必要はない。
 *
 * その結果、環境によってはリダイレクトループが起きる可能性があるため、
 * ここでは「すべてのリクエストをそのまま通す」だけにしている。
 *
 * 認可ガードやログインチェックは各ページ側の実装に任せる。
 */
export function middleware(_req: NextRequest) {
  // 何もせず素通り
  return NextResponse.next();
}

// 一応 matcher は以前と同じに保つが、中身は no-op
export const config = {
  matcher: ["/((?!_next/|static/|favicon.ico).*)"],
};
