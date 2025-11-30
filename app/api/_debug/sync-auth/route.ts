// app/api/_debug/sync-auth/route.ts
import { NextResponse } from 'next/server'

// デバッグ用エンドポイント
// 本番ビルドでは Supabase 連携を行わず、固定レスポンスのみ返す
export async function GET() {
  return NextResponse.json({
    ok: true,
    debug: 'sync-auth endpoint disabled in production build',
  })
}
