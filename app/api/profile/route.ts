k// app/api/profile/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET(req: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies, headers }
  );

  const { data: { user } } = await supabase.auth.getUser();

  return NextResponse.json({
    ok: true,
    user: user ? { id: user.id, email: user.email } : null,
  });
}

