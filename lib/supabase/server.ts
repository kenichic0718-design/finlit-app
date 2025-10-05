// lib/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export function getSupabaseServerClient(): SupabaseClient {
  const store = cookies()

  // 注意: RSC では cookies().set が無効なタイミングがあるため try-catch でラップ
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value
        },
        set(name: string, value: string, options: Parameters<typeof store.set>[0] extends object ? Omit<Parameters<typeof store.set>[0], 'name'|'value'> : any) {
          try {
            store.set({ name, value, ...(options as any) })
          } catch {}
        },
        remove(name: string, options?: any) {
          try {
            store.delete({ name, ...(options || {}) })
          } catch {}
        },
      },
    },
  )
}

