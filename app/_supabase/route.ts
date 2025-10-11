import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient, type SupabaseClient } from '@supabase/ssr'
const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export function getSupabaseRoute(): SupabaseClient {
  const store = cookies()
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) { return store.get(name)?.value },
      set(name: string, value: string, options: any) { store.set({ name, value, ...options }) },
      remove(name: string, options: any) { store.set({ name, value: '', ...options, maxAge: 0 }) },
    }
  })
}
