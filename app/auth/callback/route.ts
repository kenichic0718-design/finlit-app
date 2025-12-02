// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Supabase のマジックリンク / メールリンクから戻ってきたときに、
 * code / token_hash をセッションに交換して Cookie を張る Route Handler。
 *
 * - /auth/callback?code=...&next=/foo
 * - /auth/callback?token_hash=...&next=/foo
 * の両方に対応。
 *
 * middleware.ts / supabaseServer.ts と同じく @supabase/ssr を使うことで、
 * Cookie の形式・プロジェクト設定を完全に統一する。
 */
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);

  const nextPath = requestUrl.searchParams.get("next") || "/";
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const errorDesc = requestUrl.searchParams.get("error_description");

  // Supabase 側のエラーが明示されている場合はログインに戻す
  if (errorDesc) {
    console.error("[auth/callback] error_description:", errorDesc);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  // middleware / supabaseServer と同じ Cookie 共有領域
  const cookieStore = cookies() as any;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  let authError: unknown = null;

  // 新方式: ?code=...（PKCE）
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  }
  // 旧方式: ?token_hash=...（verifyOtp）
  else if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });
    authError = error;
  } else {
    // どちらも無い → ログインへ戻す
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

  // ここまで来れば Cookie にセッションが書き込まれている
  // → 次のリクエストでは middleware / getSupabaseServer から user が見える
  return NextResponse.redirect(new URL(nextPath, req.url));
}

