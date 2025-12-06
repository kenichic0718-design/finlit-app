// app/api/auth/magic/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as {
    email?: string;
  };

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "missing email" },
      { status: 400 }
    );
  }

  // Next 15 では cookies() が Promise 型として扱われるため await
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Next 15 の cookies().set はオブジェクト引数
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // 現在の環境の origin（例: https://finlit-app-chi.vercel.app）
  const url = new URL(req.url);
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? `${url.protocol}//${url.host}`;

  const emailRedirectTo = `${origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true });
}

