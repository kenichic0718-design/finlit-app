// app/api/auth/magic/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type SupabaseCookie = {
  name: string;
  value: string;
  // Supabase から渡ってくる options はかなり複雑なので any で受ける
  options: any;
};

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

  // Next 15 では cookies() が Promise として扱われるケースがあるので念のため await
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // ★ここがポイント：サーバー側クライアントも PKCE を明示
      auth: {
        flowType: "pkce",
      },
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

  // 本番／ローカルどちらでも適切な URL になるように origin から組み立てる
  const origin =
    req.headers.get("origin") ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // ここに PKCE コードが付いた状態で戻ってくる想定
      emailRedirectTo: `${origin}/auth/callback`,
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

