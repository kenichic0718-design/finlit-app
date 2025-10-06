// lib/supabase/server.ts
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// .env が揃っているか軽量に確認（ルートで早期 return したい所で使える）
export function envReady() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Next.js の cookies() を Supabase が要求するインターフェースに変換
function cookieAdapter() {
  const store = cookies()

  // 旧 API（get/set/remove）…一部の環境ではこちらが使われる
  const legacy = {
    get(name: string) {
      return store.get(name)?.value
    },
    set(name: string, value: string, options?: CookieOptions) {
      // Next.js の CookieOptions は互換があるのでそのまま渡す
      store.set(name, value, options as any)
    },
    remove(name: string, options?: CookieOptions) {
      store.set(name, '', { ...(options as any), maxAge: 0 })
    },
  }

  // 新 API（getAll/setAll）…本番（Vercel）でこちらを厳密に要求される場合がある
  const modern = {
    getAll() {
      // Supabase 側が { name, value } の配列を期待
      return store.getAll().map((c) => ({ name: c.name, value: c.value }))
    },
    setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
      cookiesToSet.forEach(({ name, value, options }) => {
        store.set(name, value, options as any)
      })
    },
  }

  // 両方返しておけば、どちらの判定にも確実に合致する
  return { ...legacy, ...modern }
}

/** サーバー（Route Handlers / Server Components）で使う認証付きクライアント */
export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createServerClient(url, anon, { cookies: cookieAdapter() })
}

/** 必要ならサービスロールで使う管理クライアント */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createServerClient(url, svc, { cookies: cookieAdapter() })
}

/** OAuth / マジックリンクのコールバック用ユーティリティ */
export async function handleAuthCallback(req: NextRequest) {
  const url = new URL(req.url)
  const redirectTo = url.searchParams.get('redirect_to') || '/settings'

  const supabase = getSupabaseServer()
  const code = url.searchParams.get('code')
  const verifier = url.searchParams.get('code_verifier')

  if (!code || !verifier) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('invalid request: both auth code and code verifier should be non-empty')}`, url.origin),
      { status: 307 }
    )
  }

  const { error } = await supabase.auth.exchangeCodeForSession({ code, codeVerifier: verifier })
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
      { status: 307 }
    )
  }

  return NextResponse.redirect(new URL(redirectTo, url.origin), { status: 307 })
}

