// app/api/logs/add/route.ts  ← 全置換
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import * as LogsTypes from '@/types/logs'

const LOGS_TABLE: string = (LogsTypes as any).LOGS_TABLE ?? 'logs'

// types/logs.ts にある Column メタ（LogsColumns）だけを見る。
// ※ LOGS_COLUMNS という名前は参照しない（ビルド警告の誤検知を避けるため）
const LOGS_COLUMNS: readonly string[] =
  (LogsTypes as any)?.LogsColumns?.map?.((c: any) => c?.name)?.filter(Boolean) ?? []

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const payload = await req.json().catch(() => ({} as Record<string, unknown>))

    // 許可カラムのみ通す（types/logs.ts が無い環境でも amount は必ず通す）
    const ALLOW_ALWAYS = new Set(['amount'])
    const body: Record<string, unknown> =
      LOGS_COLUMNS.length > 0
        ? Object.fromEntries(
            Object.entries(payload).filter(
              ([k]) => LOGS_COLUMNS.includes(k) || ALLOW_ALWAYS.has(k)
            )
          )
        : payload

    // amount を整数に正規化（整数カラムに合わせる / 少数なら四捨五入）
    if (body.amount !== undefined) {
      const n = Number(body.amount)
      if (!Number.isFinite(n)) {
        return NextResponse.json(
          { ok: false, error: 'amount must be a number' },
          { status: 400 }
        )
      }
      body.amount = Math.round(n)
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

