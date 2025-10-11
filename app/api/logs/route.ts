import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import * as LogsTypes from '@/types/logs'
const LOGS_TABLE: string = (LogsTypes as any).LOGS_TABLE ?? 'logs'
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 20) || 20, 200)

    const { data, error } = await supabase
      .from(LOGS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true, items: data ?? [] })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'unknown error' },
      { status: 500 }
    )
  }
}
