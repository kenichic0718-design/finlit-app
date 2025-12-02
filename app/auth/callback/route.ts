// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/**
 * Supabase のメールリンク / Magic Link から戻ってきたときに、
 * code を Supabase に渡してセッションを張る Route Handler。
 *
 * - /auth/callback にアクセスされたら必ずここを通る
 * - 成功したら next パラメータ or / にリダイレクト
 */
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);

  // ログイン後の遷移先。/login で付けた ?next=... をそのまま使う
  const nextPath = requestUrl.searchParams.get("next") || "/";

  // Supabase から渡される code（Magic Link 用）
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    // code が無ければログイン画面に戻す
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const supabase = createRouteHandlerClient({ cookies });

  // code をセッションに交換して Cookie を張る
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error);
    // 失敗した場合も、とりあえずログイン画面に戻す
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ログイン成功：next で指定されたパス or / に飛ばす
  return NextResponse.redirect(new URL(nextPath, req.url));
}

