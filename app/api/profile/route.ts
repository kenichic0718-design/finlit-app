import { NextResponse } from 'next/server'
import { getSupabaseRoute } from '@/app/_supabase/route'
export async function GET() {
  const supabase = getSupabaseRoute()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 401 })
  if (!user)   return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  // 必要に応じて profiles テーブルを読むなどの処理を後で追加
  return NextResponse.json({ ok: true, user })
}
