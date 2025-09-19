"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 必要なら Database 型を入れてください（省略でも動きます）
type Database = any;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// HMR や複数モジュールからの import でも 1 個だけにするため globalThis にキャッシュ
declare global {
  // eslint-disable-next-line no-var
  var __FINLIT_SUPABASE__: SupabaseClient<Database> | undefined;
}

// storageKey を固定して衝突を避けつつ、グローバルに単一インスタンスを保持
const globalForSupabase = globalThis as unknown as {
  __FINLIT_SUPABASE__?: SupabaseClient<Database>;
};

export const supabase: SupabaseClient<Database> =
  globalForSupabase.__FINLIT_SUPABASE__ ??
  createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // 同じキーで複数インスタンスを作らない限り OK。衝突を避けるためアプリ独自名に。
      storageKey: "finlit-auth",
      detectSessionInUrl: true,
    },
  });

globalForSupabase.__FINLIT_SUPABASE__ = supabase;

// 既存コードとの互換用（お好みで）：関数形式が必要な箇所向け
export function getSupabaseClient() {
  return supabase;
}

export default supabase;

