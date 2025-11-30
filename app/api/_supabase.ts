// app/api/_supabase.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export function getSupabase() {
  const cookieStore = cookies();

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

/** 認証チェック（RLS前の早期エラー用、不要なら各 route から削ってOK） */
export async function requireAuth() {
  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    const err = new Error("unauthorized");
    // @ts-ignore
    err.status = 401;
    throw err;
  }
  return { supabase, user };
}

