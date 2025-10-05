// app/auth/callback/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (!code) {
    // code が無いときはログインに戻す
    return NextResponse.redirect(new URL('/login?error=missing_code', req.url));
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies, headers } // ← Next.js 組込みの cookies()/headers() を渡す
  );

  // Magic Link の code をセッションに交換（ここで auth cookie が Set-Cookie される）
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // 失敗時はログインに戻す
    return NextResponse.redirect(new URL(`/login?error=cb_${encodeURIComponent(error.message)}`, req.url));
  }

  // 成功したら任意の場所へ
  return NextResponse.redirect(new URL(next, req.url));
}

