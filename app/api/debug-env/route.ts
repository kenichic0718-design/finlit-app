import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return NextResponse.json({
    hasUrl: Boolean(url),
    hasAnon: Boolean(anon),
    urlHead: url.slice(0, 40),   // 値漏れ防止で先頭だけ
    anonHead: anon.slice(0, 8),  // 同上
  });
}
