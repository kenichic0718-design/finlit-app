// lib/supabase/ssr.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getSupabaseServer() {
  // Next.js 15 の型では Promise 扱いになっているが、
  // 実行時は従来どおり cookie store として使えるため型だけ上書きする
  const store = cookies() as any;

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        store.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        // next/headers に remove がないため、有効期限を過去にして上書き
        store.set(name, "", { ...options, expires: new Date(0) });
      },
    },
  });
}
