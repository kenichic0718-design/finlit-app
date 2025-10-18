// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // 任意（管理 API が使う）

/** 環境変数の最低限チェック */
export const envReady =
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_ANON_KEY);

/** Next.js App Router で使う SSR クライアント（Node/Edge どちらでもOK） */
export function getServerSupabase() {
  const store = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        store.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        store.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}

/** 互換：旧名で import している場所のための alias */
export const getSupabaseServer = getServerSupabase;

/** 管理用（Service Role）。サーバー専用。 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
  }
  return createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/** 現在ログイン中ユーザー（未ログインなら null） */
export async function getAuthUser() {
  const supabase = getServerSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

