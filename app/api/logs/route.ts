// app/api/logs/route.ts
import { NextResponse } from "next/server";
import { getServerSupabase, getAuthUser } from "@/lib/supabase/server";

/** GET /api/logs?limit=200 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "200"), 500);

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServerSupabase();

    // profiles を経由して自分のログだけ
    const { data, error } = await supabase
      .from("logs")
      .select("id, profile_id, date, amount, memo, is_income, profiles!inner(user_id)")
      .eq("profiles.user_id", user.id)
      .order("date", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // profiles の結合列は返さない
    const items = (data ?? []).map(({ profiles, ...row }) => row);
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unhandled error" }, { status: 500 });
  }
}

/** POST /api/logs  本文: { date:string, amount:number, memo?:string|null, is_income?:boolean } */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      date?: string;
      amount?: number;
      memo?: string | null;
      is_income?: boolean;
    };

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // ユーザーの profile_id を取得
    const supabase = getServerSupabase();
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (pErr) return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 });
    if (!profile) return NextResponse.json({ ok: false, error: "Profile not found for user" }, { status: 404 });

    const row = {
      profile_id: profile.id,
      date: body.date,
      amount: body.amount,
      memo: body.memo ?? null,
      is_income: body.is_income ?? false,
    };

    const { data, error } = await supabase
      .from("logs")
      .insert(row)
      .select("id, profile_id, date, amount, memo, is_income")
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unhandled error" }, { status: 500 });
  }
}

