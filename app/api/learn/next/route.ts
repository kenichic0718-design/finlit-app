// app/api/learn/next/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { envReady, getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// このAPI内で完結する ensureProfile
async function ensureProfileLocal() {
  const store = await cookies(); // ★ここだけ変更
  let vid = store.get("vid")?.value || store.get("finlit_vid")?.value;

  if (!vid) {
    vid = randomUUID();
    const base = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    };
    store.set("vid", vid, base);
    store.set("finlit_vid", vid, base);
  }

  const supa = getSupabaseAdmin();

  const { data: existing, error: selErr } = await supa
    .from("profiles")
    .select("id")
    .eq("visitor_id", vid)
    .maybeSingle();

  if (!selErr && existing?.id) return { id: existing.id as string, visitorId: vid };

  const id = randomUUID();
  const { error: insErr } = await supa.from("profiles").insert({ id, visitor_id: vid });
  if (insErr) throw insErr;
  return { id, visitorId: vid };
}

// 文字列/配列の choices を安全に配列へ
function normalizeChoices(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const j = JSON.parse(raw);
      if (Array.isArray(j)) return j.map(String);
    } catch {
      // "A|B|C|D" のような簡易区切りにも一応対応
      if (raw.includes("|")) return raw.split("|").map((s) => s.trim());
    }
  }
  return [];
}

export async function GET(req: Request) {
  try {
    if (!envReady()) {
      return NextResponse.json({ ok: false, error: "Not ready" }, { status: 500 });
    }

    const me = await ensureProfileLocal();
    const supa = getSupabaseAdmin();

    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || undefined;
    const review = ["1", "true", "yes", "on"].includes(
      (url.searchParams.get("review") || "").toLowerCase()
    );
    // 直近で表示済みのIDなどをカンマで除外できる
    const exclude = (url.searchParams.get("exclude") || "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));

    // 候補となる question_id を用意
    let candidateIds: number[] = [];

    if (review) {
      // 不正解になった履歴から候補を抽出（新しい順に広めに取ってランダム）
      const { data: wrongRows, error: wErr } = await supa
        .from("quiz_results")
        .select("question_id")
        .eq("profile_id", me.id)
        .eq("is_correct", false)
        .order("created_at", { ascending: false })
        .limit(300);
      if (wErr) throw wErr;
      candidateIds = Array.from(
        new Set((wrongRows ?? []).map((r) => Number(r.question_id)).filter(Boolean))
      );
    }

    // 実体のクイズを取得
    let questions: any[] = [];
    if (review && candidateIds.length) {
      let q = supa.from("quiz_questions").select("*").in("id", candidateIds).limit(200);
      if (topic) q = q.eq("topic", topic);
      const { data, error } = await q;
      if (error) throw error;
      questions = data ?? [];
    } else {
      // 通常出題: トピックで絞ってから20件ほど取り、サーバ側でランダム選択
      let q = supa.from("quiz_questions").select("*").limit(50);
      if (topic) q = q.eq("topic", topic);
      const { data, error } = await q;
      if (error) throw error;
      questions = data ?? [];
    }

    // 除外IDを弾く
    const filtered = questions.filter((q) => !exclude.includes(Number(q.id)));
    if (!filtered.length) {
      return NextResponse.json(
        { ok: false, error: "候補がありません。条件を変更して再試行してください。" },
        { status: 404 }
      );
    }

    // ランダム1問
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    const payload = {
      id: Number(pick.id),
      topic: String(pick.topic || ""),
      question: String(pick.question || ""),
      choices: normalizeChoices(pick.choices),
      answer_index: Number(pick.answer_index ?? -1),
      rationale_correct: String(pick.rationale_correct || ""),
      rationale_wrong: String(pick.rationale_wrong || ""),
    };

    if (!payload.question || !payload.choices.length || payload.answer_index < 0) {
      return NextResponse.json(
        { ok: false, error: "問題データが不完全です。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, item: payload });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
