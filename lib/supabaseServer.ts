// lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Server Component / API 用 Supabase クライアント（認証付き）
 *
 * - middleware.ts や /logout ルートと同じく @supabase/ssr を使用する
 * - Cookie の形式（先頭が "base64-" の値）も含めて統一し、
 *   「Cookie はあるのに auth.getUser() が null」になる問題を防ぐ
 *
 * - Server Component では Cookie の set/remove は行えないため、
 *   ここでは get だけ実装する（サインアウトなどの Cookie 更新は
 *   /logout や /api/auth/signout が担当）。
 */
export function supabaseServer() {
  // Next.js 15 で cookies() の型が Promise 扱いされているため、
  // ここでは any キャストで型エラーだけを吸収する（挙動は従来どおり）。
  const cookieStore = cookies() as any;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  return supabase;
}
