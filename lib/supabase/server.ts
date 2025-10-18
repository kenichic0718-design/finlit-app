// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Next.js App Router で使う Supabase SSR クライアント。
 * Edge/Node どちらでも動き、cookie を get/set/remove できます。
 */
export function getServerSupabase() {
  const cookieStore = cookies();

  const client = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        // remove は maxAge=0 で上書き
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  return client;
}

/** 現在ログイン中のユーザーを取得（未ログインなら null） */
export async function getAuthUser() {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

