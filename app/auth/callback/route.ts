// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/**
 * Supabase の Magic Link / OTP から戻ってきたときに
 * `code` をセッション Cookie に交換し、その後アプリ内のページへ
 * リダイレクトするための Route Handler。
 *
 * Cookie の扱いは @supabase/auth-helpers-nextjs に任せる。
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // code が無い場合は素直に /login へ戻す
  if (!code) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Supabase クライアント（Cookie 管理込み）
  const supabase = createRouteHandlerClient({ cookies });

  // code → セッションに交換
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error);
    const errorUrl = new URL("/login", req.url);
    errorUrl.searchParams.set("error", "auth");
    return NextResponse.redirect(errorUrl);
  }

  // next が付いていたら優先してそちらへ、なければ `/`
  const next = url.searchParams.get("next") || "/";
  const redirectUrl = new URL(next, req.url);

  return NextResponse.redirect(redirectUrl);
}

