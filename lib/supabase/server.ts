// lib/supabase/server.ts
// ─────────────────────────────────────────────────────────────
// サーバー側（Route Handlers / Server Components）で使う Supabase クライアント。
// - createServerClient: Cookie アダプタは get / set / remove のみ（getAll/setAll 不要）
// - 管理クライアント（サービスロール）は cookie 不要
// - 旧コード互換の envReady() も提供
// ─────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Database 型をお持ちなら import して差し替えてください。
// import type { Database } from '@/types/database'
type Database = any

/** Next.js の cookies() を Supabase SSR 用にラップ（get / set / remove のみでOK） */
function cookieAdapter() {
  const store = cookies()
  return {
    get(name: string) {
      return store.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      // set は例外化する必要がないため念のため try-catch
      try {
        store.set({ name, value, ...options })
      } catch {
        /* no-op */
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        store.set({ name, value: '', ...options, maxAge: 0 })
      } catch {
        /* no-op */
      }
    },
  }
}

/** 認証付きの通常サーバー用クライアント（Route Handlers / Server Components 等） */
export function getSupabaseServer(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createServerClient<Database>(url, anon, {
    cookies: cookieAdapter(),
  })
}

/** サービスロール（管理処理向け）。cookie は使わない */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    // 解析や管理用途での一時的な読み書きが主なので、念のため no-store
    global: { fetch: (input, init) => fetch(input, { cache: 'no-store', ...init }) },
  })
}

/** 旧実装互換：最低限の環境変数が揃っているか簡易チェック */
export function envReady(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

