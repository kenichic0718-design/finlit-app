// app/api/debug/session/route.ts
import { NextResponse } from "next/server";

/**
 * 本番ビルド用のデバッグスタブ
 *
 * Supabase には触れず、常に ok:true を返すだけのルート。
 * ローカルで本格的にセッション確認したい場合は、
 * 別の _debug ルートを使う or ここを書き直す。
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    hasSession: null,
    userId: null,
    error: null,
    note: "debug session route is stubbed for production build",
  });
}
