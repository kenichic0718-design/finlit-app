// app/_supabase/server.ts
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// APIが「準備OKか」を使う場所があるので共通化
export function envReady() {
  return Boolean(URL && ANON && SERVICE);
}

export function getSupabaseServer() {
  if (!envReady()) throw new Error("Supabase env not ready");
  return createClient(URL, ANON, {
    auth: { persistSession: false },
  });
}

export function getSupabaseAdmin() {
  if (!envReady()) throw new Error("Supabase env not ready");
  // サーバー側（RLSを跨ぐ必要がある作成/更新/削除用）
  return createClient(URL, SERVICE, {
    auth: { persistSession: false },
  });
}

