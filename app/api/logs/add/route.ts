import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import * as LogsTypes from '@/types/logs'
const LOGS_TABLE: string = (LogsTypes as any).LOGS_TABLE ?? 'logs'
const LOGS_COLUMNS: readonly string[] =
  (LogsTypes as any).LogsColumns?.map?.((c: any) => c?.name).filter(Boolean) ??
  (LogsTypes as any).LOGS_COLUMNS ??
  []
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const payload = await req.json().catch(() => ({} as Record<string, unknown>))

    // 許可カラムのみ通す（types/logs.ts が無い環境でも amount は必ず通す）
    const ALLOW_ALWAYS = new Set(['amount'])
    const body: Record<string, unknown> =
      LOGS_COLUMNS.length > 0
        ? Object.fromEntries(
            Object.entries(payload).filter(([k]) => LOGS_COLUMNS.includes(k) || ALLOW_ALWAYS.has(k))
          )
        : payload

    // amount を整数に正規化（少数が来たら四捨五入）
    if (body.amount !== undefined) {
      const n = Number(body.amount)
      if (!Number.isFinite(n)) {
        return NextResponse.json(
          { ok: false, error: 'amount must be a number' },
          { status: 400 }
        )
      }
      body.amount = Math.round(n) // ← integer カラムに合わせる
    }

    const { error } = await supabase.from(LOGS_TABLE).insert([body])
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'unknown error' },
      { status: 500 }
    )
  }
}
