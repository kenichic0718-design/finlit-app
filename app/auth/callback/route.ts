// app/auth/callback/route.ts
/**
 * Supabase Magic Link / OTP コールバック
 *
 * - /login から signInWithOtp(emailRedirectTo=/auth/callback?next=...) で飛んでくる
 * - クエリパラメータの code を Supabase に渡してセッションを確立
 * - Cookie は @supabase/ssr の createServerClient で発行し、
 *   middleware.ts / lib/supabaseServer.ts とフォーマットを統一する
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // PKCE 付き Magic Link では code クエリが付与される
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  // code が無いアクセス（直接叩かれたなど）はログイン画面へ
  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", url.origin),
    );
  }

  // 最終的にリダイレクトしたい先（ダッシュボードなど）
  const redirectTarget = new URL(next, url.origin);
  const res = NextResponse.redirect(redirectTarget);

  // ここで @supabase/ssr の client を作り、Cookie の読み書きを
  // NextRequest / NextResponse 経由で行う
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // ブラウザに返すレスポンス側の Cookie だけ更新すれば十分
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: "",
            ...options,
            maxAge: 0,
          });
        },
      },
    },
  );

  try {
    // code をセッションに交換して Cookie を発行
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(
        new URL("/login?error=callback", url.origin),
      );
    }
  } catch (e) {
    console.error("[auth/callback] unexpected error:", e);
    return NextResponse.redirect(
      new URL("/login?error=callback", url.origin),
    );
  }

  // セッション確立済みの Cookie を付けて next 先へ
  return res;
}

