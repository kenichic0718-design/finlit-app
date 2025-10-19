// app/api/categories/add/route.ts
import { NextResponse } from "next/server";
import { requireAuthProfile } from "@/lib/supabase/server";

// 200/4xx を簡潔に返すユーティリティ
function json<T>(body: T, status = 200) {
  return NextResponse.json(body as any, { status });
}

type Kind = "expense" | "income";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // 1) サインイン & プロファイル確認（RLS前提）
  const auth = await requireAuthProfile();
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const { supabase, profileId } = auth;

  // 2) 入力をできるだけ寛容にパース
  //    - kind は body.kind でも ?kind= でもOK。既知以外なら "expense" にフォールバック
  //    - name は body.name || body.fname || body.category || body.title のどれでもOK
  let body: any = null;
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const url = new URL(req.url);
  const qKind = (url.searchParams.get("kind") || "").toLowerCase();
  const bKind = (body?.kind || "").toLowerCase();
  const kindRaw = (qKind || bKind) as Kind;
  const kind: Kind = kindRaw === "income" || kindRaw === "expense" ? kindRaw : "expense";

  const nameRaw =
    (body?.name ??
      body?.fname ??
      body?.category ??
      body?.title ??
      "").toString();

  const name = nameRaw.trim();

  if (!name) return json({ ok: false, error: "name is required" }, 400);

  // 3) 既存重複の軽いチェック（任意）
  //    ※ 同名許容ならこのブロックは削除可
  const { data: dup, error: dupErr } = await supabase
    .from("categories")
    .select("id")
    .eq("profile_id", profileId)
    .eq("name", name)
    .eq("kind", kind)
    .maybeSingle();

  if (dupErr) return json({ ok: false, error: dupErr.message }, 500);
  if (dup) return json({ ok: false, error: "Already exists" }, 409);

  // 4) 追加
  const { data, error } = await supabase
    .from("categories")
    .insert({ profile_id: profileId, name, kind })
    .select()
    .maybeSingle();

  if (error) return json({ ok: false, error: error.message }, 500);

  return json({ ok: true, item: data });
}

