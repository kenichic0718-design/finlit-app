// app/api/auth/magic/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email) {
    return NextResponse.json(
      { ok: false, error: 'missing email' },
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
        setAll(list) {
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
      // 本番に合わせるならここはあとで変更
      emailRedirectTo: 'http://localhost:3000/auth/callback',
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
