// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const redirectTo = url.searchParams.get('redirect_to') || '/settings';

  // ログ：デバッグしやすく
  console.log('[AUTH_CB]', url.toString());

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', url));
  }

  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error.message)}`,
        url,
      ),
    );
  }

  return NextResponse.redirect(new URL(redirectTo, url));
}

