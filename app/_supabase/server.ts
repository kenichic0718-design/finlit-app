import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js'
const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
export function envReady(): boolean {
  const ok = !!url && !!anon
  if (!ok) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return true
}
export function getSupabaseServer(): SupabaseClient {
  const store = cookies()
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) { return store.get(name)?.value },
      set(name: string, value: string, options: any) { store.set({ name, value, ...options }) },
      remove(name: string, options: any) { store.set({ name, value: '', ...options, maxAge: 0 }) },
    }
  })
}
export const createClient = getSupabaseServer
export function getSupabaseAdmin(): SupabaseClient {
  if (!service) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  // Service Role は Cookie 連携不要なので supabase-js の純粋クライアントで OK
  return createAdminClient(url, service)
}
export type { SupabaseClient }
