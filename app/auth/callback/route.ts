// app/auth/callback/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Node 実行 & 毎回実行（キャッシュしない）
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Supabase からのマジックリンク（/auth/v1/verify?type=magiclink&code=...）
 * で飛んでくる code をセッションに交換して Cookie を張る。
 */
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  // code が無ければ素直に /login へ戻す
  if (!code) {
    return NextResponse.redirect(new URL('/login', requestUrl.origin));
  }

  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Route Handler 用の Supabase Client（Cookie を正しく書き込む）
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Route Handler 内では cookieStore.set が許可されており、
        // ここで設定した値はレスポンスの Set-Cookie として反映される。
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({
          name,
          value: '',
          ...options,
          maxAge: 0,
        });
      },
    },
  });

  // ここでセッションが確立され、ブラウザに sb-... Cookie がセットされる
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  // 失敗しても、とりあえずログイン画面に戻す（詳細はログで見る）
  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(new URL('/login', requestUrl.origin));
  }

  // 成功時は next の場所へ
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

