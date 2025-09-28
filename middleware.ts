// middleware.ts（プロジェクト直下）
import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  // これにより期限が近いセッションも毎リクエストで更新される
  await supabase.auth.getSession();
  return res;
}

