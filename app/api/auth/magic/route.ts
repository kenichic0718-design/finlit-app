// app/api/auth/magic/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as {
    email?: string;
  };

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "missing email" },
      { status: 400 }
    );
  }

  // リクエスト URL から origin を取って /auth/callback を組み立てる
  // - ローカル:  http://localhost:3000/auth/callback
  // - Vercel:   https://finlit-app-chi.vercel.app/auth/callback
  const url = new URL(req.url);
  const emailRedirectTo = `${url.origin}/auth/callback`;

  // Next 15 では cookies() が Promise 型として扱われるため await する
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // ★ PKCE を明示
      auth: {
        flowType: "pkce",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // 型エラー回避のため any を明示的に付ける（noImplicitAny 対策）
        setAll(list: any[]) {
          list.forEach(({ name, value, options }) => {
            // Next 15 の cookies().set はオブジェクト引数
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // PKCE 用のコールバック URL（ローカル・本番共通）
      emailRedirectTo,
    },
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true });
}

