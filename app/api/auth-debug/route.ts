import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  const supabase = getSupabaseServer()
  const [session, user] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ])
  return NextResponse.json({ session: session.data, user: user.data })
}

