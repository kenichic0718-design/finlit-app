// app/auth/callback/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Magic Link / パスワードレス用コールバック
 *
 * - URL に付いてくる ?code=...（PKCE）を Supabase に渡してセッションを張る
 * - 旧リンク用の token_hash も一応フォールバックで対応
 */
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);

  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash"); // 古いリンク用フォールバック
  const nextPath = requestUrl.searchParams.get("next") ?? "/";

  const redirectToLogin = (reason: "missing_code" | "callback_failed") => {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", reason);
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  };

  // code も token_hash も無い → そもそも不正なリンク
  if (!code && !tokenHash) {
    return redirectToLogin("missing_code");
  }

  // 🔹 型エラー対策：Promise を await してから使う
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  try {
    if (code) {
      // 🔹 PKCE 用：code をセッションに交換
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[auth/callback] exchangeCodeForSession error", error);
        return redirectToLogin("callback_failed");
      }
    } else if (tokenHash) {
      // 🔹 念のため: 旧 Magic Link(token_hash) のフォールバック
      const { error } = await (supabase.auth as any).verifyOtp({
        type: "magiclink",
        token_hash: tokenHash,
      });
      if (error) {
        console.error("[auth/callback] verifyOtp error", error);
        return redirectToLogin("callback_failed");
      }
    }
  } catch (error) {
    console.error("[auth/callback] unexpected error", error);
    return redirectToLogin("callback_failed");
  }

  // ここまで来たら Cookie にセッションが張れている想定
  const redirectUrl = new URL(nextPath, requestUrl.origin);
  return NextResponse.redirect(redirectUrl);
}

