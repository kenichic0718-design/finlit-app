// app/logout/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = getSupabaseServer();
  await supabase.auth.signOut();

  return NextResponse.redirect(
    new URL(
      '/login?next=%2Fsettings',
      process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    )
  );
}
