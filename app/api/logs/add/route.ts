// app/api/logs/add/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'

// 型ファイルの export 名がバラついても動くようにワイルドカードで読み込む
import * as LogsTypes from '@/types/logs'

// export の有無に関わらず安全に参照できるようにフォールバック
const LOGS_TABLE: string =
  (LogsTypes as any).LOGS_TABLE ?? 'logs'

// カラム一覧は存在すれば使う。無ければ「そのまま挿入」方針にする
const LOGS_COLUMNS: readonly string[] =
  (LogsTypes as any).LogsColumns ??
  (LogsTypes as any).LOGS_COLUMNS ?? // もし別名で出していた場合の保険
  []

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const payload = await req.json().catch(() => ({} as Record<string, unknown>))

    // カラム定義があれば、そのカラムだけに絞り込む
    const body: Record<string, unknown> =
      LOGS_COLUMNS.length > 0
        ? Object.fromEntries(
            Object.entries(payload).filter(([k]) => LOGS_COLUMNS.includes(k))
          )
        : payload

    const { error } = await supabase.from(LOGS_TABLE).insert([body])
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'unknown error' },
      { status: 500 }
    )
  }
}

