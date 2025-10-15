// app/api/debug-logs/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';     // 認証中のユーザー確認用
import { createClient } from '@supabase/supabase-js';   // 管理(サービスキー)クライアント

export async function GET() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // 認証中ユーザー（参考表示）
  const sb = createServerClient(url, anon, {
    cookies: {
      getAll() { return cookies().getAll(); },
      setAll() {},
    },
  });
  const { data: userData } = await sb.auth.getUser();

  // ★ RLSを無視して全体を覗く（サービスキー）
  const admin = createClient(url, svc);
  const { data: rows, error } = await admin
    .from('logs')
    .select('*')
    .order('id', { ascending: false })
    .limit(5);

  return NextResponse.json({
    ok: !error,
    error: error?.message ?? null,
    authedUser: userData?.user ?? null,
    rows,
  });
}

