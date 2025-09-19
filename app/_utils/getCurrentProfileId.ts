"use client";

/**
 * 認証なし運用版:
 * - localStorage の visitor_id を使って users → profiles をひも付け
 * - 無ければ visitor_id を発行し、users / profiles を作成
 *
 * 前提スキーマ:
 *   users(id uuid PRIMARY KEY, visitor_id uuid UNIQUE)
 *   profiles(id uuid PRIMARY KEY)
 *   logs.profile_id, budgets.profile_id は profiles.id へのFK
 */

import { getSupabaseClient } from "@/lib/supabaseClient";

/** localStorage に保存するキー名（既存と合わせる） */
const VISITOR_KEY_CANDIDATES = ["visitor_id", "finlit_visitor_id"];

function getStoredVisitorId(): string | null {
  for (const k of VISITOR_KEY_CANDIDATES) {
    const v = typeof window !== "undefined" ? localStorage.getItem(k) : null;
    if (v) return v;
  }
  return null;
}

function saveVisitorId(id: string) {
  // どれか1つに統一して保存（既存キーがあればそれも更新）
  localStorage.setItem("visitor_id", id);
  for (const k of VISITOR_KEY_CANDIDATES) {
    if (k !== "visitor_id") localStorage.setItem(k, id);
  }
}

export async function getCurrentProfileId(): Promise<string> {
  const supabase = getSupabaseClient();

  // 1) visitor_id を確定
  let visitorId = getStoredVisitorId();
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    saveVisitorId(visitorId);
  }

  // 2) users に既存ひも付けがあるか確認（id = profiles.id）
  const { data: userRow, error: selErr } = await supabase
    .from("users")
    .select("id")
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (selErr && selErr.code !== "PGRST116") {
    // PGRST116: not found（maybeSingleでデータ無し）
    throw selErr;
  }

  if (userRow?.id) {
    return userRow.id; // 既存の profile_id (= users.id)
  }

  // 3) 無ければ新規作成（id をクライアントで発行し、users と profiles に同じ id を入れる）
  const newProfileId = crypto.randomUUID();

  // profiles 先に確保（重複なら無視）
  const { error: profErr } = await supabase
    .from("profiles")
    .insert({ id: newProfileId })
    .select("id")
    .single()
    .throwOnError();

  if (profErr && profErr.code !== "23505") {
    // 23505: unique_violation（既にあればOK）
    throw profErr;
  }

  // users に visitor_id とひも付け（id は profiles と同一）
  const { error: userErr } = await supabase
    .from("users")
    .insert({ id: newProfileId, visitor_id: visitorId })
    .select("id")
    .single();

  if (userErr && userErr.code !== "23505") {
    throw userErr;
  }

  return newProfileId;
}

