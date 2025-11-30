// app/api/_supabase.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Next.js 15 で cookies() の型が Promise<ReadonlyRequestCookies> になっており、
 * TypeScript 上で cookieStore.get(...) がエラーになるので、
 * 実体はそのままに型だけ any で吸収する。
 */
export function getSupabase() {
  // 型だけゆるくする（ランタイム挙動は従来どおり）
  const cookieStore = cookies() as any;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  return supabase;
}

/**
 * 認証チェック（RLS 前の早期エラー用）
 */
export async function requireAuth() {
  const supabase = getSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const err = new Error("unauthorized");
    // ステータスコードを持たせておく（使わないなら無視されるだけ）
    (err as any).status = 401;
    throw err;
  }

  return { supabase, user };
}
