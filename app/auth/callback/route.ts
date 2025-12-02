// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/**
 * Supabase のマジックリンク / メールリンクから戻ってきたときに、
 * code / token_hash をセッションに交換して Cookie を張る Route Handler。
 *
 * /auth/callback?code=...&next=/foo
 * /auth/callback?token_hash=...&next=/foo
 * の両方に対応。
 */
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);

  const nextPath = requestUrl.searchParams.get("next") || "/settings";
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const errorDesc = requestUrl.searchParams.get("error_description");

  if (errorDesc) {
    console.error("[auth/callback] error_description:", errorDesc);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createRouteHandlerClient({ cookies });

  let authError: unknown = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });
    authError = error;
  } else {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  if (authError) {
    console.error("[auth/callback] auth error:", authError);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(nextPath, req.url));
}

