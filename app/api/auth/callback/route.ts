// app/api/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type SupabaseSession = {
  access_token: string;
  refresh_token: string;
};

type CallbackBody = {
  session?: SupabaseSession;
};

export async function POST(req: Request) {
  try {
    const { session } = (await req.json()) as CallbackBody;

    if (!session?.access_token || !session?.refresh_token) {
      return NextResponse.json(
        {
          ok: false,
          error: "no-session",
          detail: "session tokens were not provided",
        },
        { status: 400 }
      );
    }

    // ★ ここだけ修正：await を付ける
    const cookieStore = await cookies();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // ★ Route Handler 専用：Cookie への set/remove を許可
    const supabase = createServerClient(url, key, {
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
    });

    const { data, error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (error || !data.session) {
      return NextResponse.json(
        {
          ok: false,
          error: "set-session-failed",
          detail: error?.message ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "server-error",
        detail: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
