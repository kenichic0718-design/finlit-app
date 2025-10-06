// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // ログに残す（デバッグ用）
  console.log('[AUTH_CB]', req.url);

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const redirectTo = url.searchParams.get('redirect_to') || '/settings';

  if (!code) {
    const u = new URL('/login?error=missing_code', req.url);
    return NextResponse.redirect(u);
  }

  const supabase = getSupabaseServer();

  // Supabase のコード交換
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  // 失敗時は login にリダイレクトしてエラー表示
  const dest = new URL(
    error
      ? `/login?error=${encodeURIComponent(error.message)}`
      : redirectTo,
    req.url
  );

  return NextResponse.redirect(dest);
}

