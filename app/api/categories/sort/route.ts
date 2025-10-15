// app/api/categories/sort/route.ts
import { NextResponse } from 'next/server';

// 互換用: position 列がない環境では何もしないで 200 を返す
export async function POST() {
  return NextResponse.json({ ok: true });
}

