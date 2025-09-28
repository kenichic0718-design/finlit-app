// app/auth/callback/route.ts（再掲/確認）
import { NextResponse } from "next/server";
import { getSupabaseRoute } from "@/app/_supabase/route";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("redirect_to") || "/settings";
  if (code) {
    const supabase = getSupabaseRoute();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(redirectTo, req.url));
}

