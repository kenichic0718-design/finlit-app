// app/api/logs/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSupabase, getAuthUser } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "200"), 500);

    const user = await getAuthUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("logs")
      .select("id, profile_id, date, amount, memo, is_income, profiles!inner(user_id)")
      .eq("profiles.user_id", user.id)
      .order("date", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    const items = (data ?? []).map(({ profiles, ...row }) => row);
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unhandled" }, { status: 500 });
  }
}

