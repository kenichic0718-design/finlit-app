// app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const urlSet = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonSet = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  const ok = urlSet && anonSet && hasServiceKey;
  return NextResponse.json({ ok, hasServiceKey, urlSet, anonSet });
}

