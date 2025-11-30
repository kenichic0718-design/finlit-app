import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    const { href } = await req.json() as { href?: string };
    if (!href || typeof href !== 'string') {
      return NextResponse.json({ ok: false, error: 'href_required' }, { status: 400 });
    }

    // ★ Cookie を積めるレスポンス（必ず NextResponse を使う）
    const res = NextResponse.json({ ok: true });

    // サーバ側 Supabase（req→get, res→set/remove で Cookie 同期）
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => req.cookies.get(name)?.value,
          set: (name: string, value: string, options: any) => {
            try { res.cookies.set({ name, value, ...options }); } catch {}
          },
          remove: (name: string, options: any) => {
            try { res.cookies.set({ name, value: '', ...options }); } catch {}
          },
        },
      }
    );

    // ★ ハッシュ/クエリ付きの URL をそのまま交換 → Set-Cookie は res に積まれる
    await supabase.auth.exchangeCodeForSession(href);

    return res; // ← Cookie を乗せたまま返す
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

