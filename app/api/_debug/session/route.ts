// app/api/_debug/session/route.ts
import { NextResponse } from 'next/server'

// デバッグ用エンドポイント
// 本番機能では使っていないため、型エラーの原因にならない
// 最小限のダミーレスポンスだけ返す
export async function GET() {
  return NextResponse.json({
    ok: true,
    debug: 'session endpoint disabled in production build',
  })
}
