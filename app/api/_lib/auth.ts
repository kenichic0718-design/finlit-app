import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/app/_utils/createSupabaseServer';

export async function requireSession(_req: NextRequest) {
  const supabase = createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    // 失敗も 200/JSON で返す（契約維持）
    return {
      ok: false as const,
      user: null,
      json: NextResponse.json({ ok: false, error: 'unauthorized' }),
    };
  }
  return { ok: true as const, user: data.user, supabase };
}

