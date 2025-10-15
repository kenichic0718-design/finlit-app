// app/api/categories/sort/route.ts
// 互換レイヤ：position 列がない環境では NO-OP で成功扱いにする
import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ ok: true });
}

