// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase の Magic Link / OTP から戻ってきたときに
 * `code` をセッション Cookie に交換し、その後アプリ内のページへ
 * リダイレクトするための Route Handler。
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // code が無い場合は素直に /login へ戻す
  if (!code) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const cookieStore = cookies();

  const supabase = createServerClient(
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

