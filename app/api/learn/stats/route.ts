// app/api/learn/stats/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { envReady, getSupabaseAdmin } from "@/lib/supabase/server";

// Cookie 名は過去互換のため2つ見る
const CANDIDATE_COOKIE_NAMES = ["finlit_vid", "vid"];

function ymdUTC(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  try {
    envReady();

    const url = new URL(req.url);
    const days = Math.max(1, Math.min(60, Number(url.searchParams.get("days") || 30)));

    // 1) profile_id 同定（visitor cookie → profiles）
    const jar = await cookies();
    let vid: string | null = null;
    for (const k of CANDIDATE_COOKIE_NAMES) {
      const v = jar.get(k)?.value;
      if (v) {
        vid = v;
        break;
      }
    }
    if (!vid) {
      // Server 側では勝手に cookie は発行しない（/api/profile 等で発行想定）
      // それでも空で来たら一時発行してしまう（統計0件で返す）
      vid = randomUUID();
    }

    const admin = getSupabaseAdmin();

    // profiles から profile_id を取得（無ければ作成）
    const { data: prof, error: pe } = await admin
      .from("profiles")
      .select("id")
      .eq("visitor_id", vid)
      .maybeSingle();

    let profileId = prof?.id as string | undefined;
    if (!profileId) {
      profileId = randomUUID();
      const { error: insErr } = await admin
        .from("profiles")
        .insert({ id: profileId, visitor_id: vid })
        .select("id")
        .single();
      if (insErr) throw insErr;
    }

    // 2) 該当期間の解答結果を取得（topic は quiz_questions から引く）
    const since = new Date(Date.now() - days * 86400_000);
    const sinceIso = since.toISOString();

    const { data: results, error: rErr } = await admin
      .from("quiz_results")
      .select("id, question_id, is_correct, created_at")
      .eq("profile_id", profileId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true });

    if (rErr) throw rErr;

    // 対象が無ければ空で返却（UIプレースホルダ用）
    if (!results || results.length === 0) {
      return NextResponse.json({
        ok: true,
        todaySolved: 0,
        todayCorrect: 0,
        todayRate: 0,
        byTopic: [],
        timeline: [],
      });
    }

    // 3) question_id -> topic を取得（JOIN不要・FK無くてもOK）
    const qids = Array.from(new Set(results.map((r) => r.question_id).filter(Boolean)));
    const { data: qs, error: qErr } = await admin
      .from("quiz_questions")
      .select("id, topic")
      .in("id", qids);

    if (qErr) throw qErr;

    const topicOf = new Map<string, string>();
    for (const q of qs ?? []) {
      topicOf.set(String(q.id), String(q.topic));
    }

    // 4) 集計
    const todayKey = ymdUTC(new Date()); // UTC基準。必要があればJST等に合わせてください
    let todaySolved = 0;
    let todayCorrect = 0;

    const byTopicMap = new Map<string, { topic: string; solved: number; correct: number }>();
    const dayMap = new Map<string, { date: string; solved: number; correct: number }>();

    for (const r of results) {
      const dateKey = ymdUTC(new Date(r.created_at));
      const isCorrect = !!r.is_correct;

      if (dateKey === todayKey) {
        todaySolved += 1;
        if (isCorrect) todayCorrect += 1;
      }

      // timeline（日別）
      const dayRow = dayMap.get(dateKey) ?? { date: dateKey, solved: 0, correct: 0 };
      dayRow.solved += 1;
      if (isCorrect) dayRow.correct += 1;
      dayMap.set(dateKey, dayRow);

      // byTopic
      const t = topicOf.get(String(r.question_id)) ?? "その他";
      const row = byTopicMap.get(t) ?? { topic: t, solved: 0, correct: 0 };
      row.solved += 1;
      if (isCorrect) row.correct += 1;
      byTopicMap.set(t, row);
    }

    const byTopic = Array.from(byTopicMap.values()).sort((a, b) =>
      a.topic.localeCompare(b.topic, "ja")
    );
    const timeline = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    const todayRate = todaySolved === 0 ? 0 : Math.round((todayCorrect / todaySolved) * 100);

    // 旧UI互換のキーも同梱（today_*）
    return NextResponse.json({
      ok: true,
      todaySolved,
      todayCorrect,
      todayRate,
      byTopic,
      timeline,
    });
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
