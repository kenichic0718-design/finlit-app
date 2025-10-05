import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
function getServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 })
        },
      },
    }
  )
}
export async function POST(req: NextRequest) {
  const supabase = getServerClient()
  const body = await req.json().catch(() => ({}))
  // ここは元のログ保存処理に合わせて実装してください
  // 例:
  // const { data, error } = await supabase.from('logs').insert({ ...body })
  // if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
