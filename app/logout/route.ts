// app/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/ssr';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login?next=%2Fsettings', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'));
}

