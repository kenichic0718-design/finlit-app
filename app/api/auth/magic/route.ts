import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ ok: false, error: 'missing email' }, { status: 400 });
  const jar = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => jar.set(name, value, options)),
      },
    }
  );
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: 'http://localhost:3000/auth/callback' },
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  return NextResponse.json({ ok: true });
}

