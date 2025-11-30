// lib/supabase-server.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export function getServerSupabase() {
  // Next.js 15 の型は Promise だが、挙動はこれまで通り扱いたいので any キャスト
  const cookieStore = cookies() as any
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        // get が存在しない場合でも安全に undefined を返す
        return cookieStore.get?.(name)?.value
      },
      /**
       * Next.js ではここを NOOP にするのが正しい
       * createServerClient は Route Handler / middleware 以外で set/remove を
       * 呼ばないので安全。内部の getUser() が壊れなくなる。
       */
      set() {
        /* noop */
      },
      remove() {
        /* noop */
      },
    },
  })
}

export const createSupabaseServer = getServerSupabase
export const getServerClient = getServerSupabase

export async function getAuthedUserId(): Promise<string | null> {
  const supabase = getServerSupabase()
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}
