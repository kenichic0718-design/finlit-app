// app/api/learn/answer/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { envReady, getSupabaseAdmin } from "@/app/_supabase/server";

const COOKIE_CANDIDATES = ["finlit_vid", "vid"];

export async function POST(req: Request) {
  try {
    envReady();
    const body = await req.json().catch(() => ({}));
    const { question_id, chosen_index, is_correct } = body ?? {};

    if (!question_id || typeof chosen_index !== "number") {
      return NextResponse.json(
        { ok: false, error: "invalid payload" },
        { status: 400 }
      );
    }

    // visitor → profile
    const jar = await cookies();
    let vid: string | null = null;
    for (const k of COOKIE_CANDIDATES) {
      const v = jar.get(k)?.value;
      if (v) { vid = v; break; }
    }
    if (!vid) vid = randomUUID();

    const admin = getSupabaseAdmin();

    const { data: prof } = await admin
      .from("profiles")
      .select("id")
      .eq("visitor_id", vid)
      .maybeSingle();

    let profile_id = prof?.id as string | undefined;
    if (!profile_id) {
      profile_id = randomUUID();
      await admin.from("profiles").insert({ id: profile_id, visitor_id: vid });
    }

    // 結果保存（topic列は一切使わない）
    const { error: insErr } = await admin.from("quiz_results").insert({
      profile_id,
      question_id,
      chosen_index,
      is_correct: !!is_correct,
    });

    if (insErr) throw insErr;

    // ここで日次進捗などを更新する場合は追加で UPDATE/UPSERT（省略可）

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
