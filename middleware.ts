import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

/**
 * すべてのリクエストでセッションをサイレント更新。
 * 静的アセット/Next内部パスはここで除外する（matcherは使わない）。
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 静的ファイルやNextの内部パスは早期return
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/api/auth") || // 使っていれば
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico|txt|xml|json)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // 認証済みならここで自動リフレッシュ、未認証は何もしない
  await supabase.auth.getSession();

  return res;
}

// ★ matcher は書かない（今回のエラー回避ポイント）

