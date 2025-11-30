// app/api/learn/required-log/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getCurrentProfileId } from "@/app/_utils/getCurrentProfileId";

export async function POST(req: NextRequest) {
  try {
    const profileId = await getCurrentProfileId();
    if (!profileId) {
      return NextResponse.json(
        { ok: false, error: "未ログインです。" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { dayKey, score, total, answers } = body ?? {};

    if (typeof dayKey !== "string" || !Array.isArray(answers)) {
      return NextResponse.json(
        { ok: false, error: "不正なリクエストです。" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    const { error } = await supabase.from("exam_results").insert({
      profile_id: profileId,
      mode: "daily_required",
      score: Number(score ?? 0),
      total: Number(total ?? 0),
      detail_json: {
        kind: "daily_required",
        dayKey,
        answers,
      },
    });

    if (error) {
      console.error("[required-log] insert error", error);
      return NextResponse.json(
        { ok: false, error: "INSERT_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[required-log] error", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

