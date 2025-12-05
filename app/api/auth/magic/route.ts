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

  // リダイレクト先のベース URL（本番 / ローカル共通で自動判定）
  const { origin } = new URL(req.url);

  // Next 15 では cookies() が Promise 型として扱われるため await する
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // ★ PKCE フローを明示
      //   これによりメールリンクが ?code=... 形式になり、
      //   /auth/callback (server route) で確実に code を拾える
      auth: {
        flowType: "pkce",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          list.forEach(({ name, value, options }) => {
            // Next 15 の cookies().set はオブジェクト引数
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    } as any // ← 型の都合で options 全体を any 扱い（動作には影響なし）
  );

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // ★ 本番でもローカルでも共通で正しい URL を使う
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true,
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

