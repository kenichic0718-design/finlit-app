// app/api/auth/magic/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase が cookies.setAll に渡してくる配列の形
type SupabaseCookie = {
  name: string;
  value: string;
  // options の型は細かくなくても良いので any にしておく（明示 any なので implicit any エラーは出ない）
  options: any;
};

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "missing email" },
      { status: 400 }
    );
  }

  // Next 15 では cookies() が Promise 型として扱われるため await する
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list: SupabaseCookie[]) {
          list.forEach(({ name, value, options }) => {
            // Next 15 の cookies().set はオブジェクト引数
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // どの環境でも「同じ origin の /auth/callback」に飛ばす
  // - dev:      http://localhost:3000/auth/callback
  // - 本番:     https://finlit-app-chi.vercel.app/auth/callback
  const emailRedirectTo = new URL("/auth/callback", req.url).toString();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
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

