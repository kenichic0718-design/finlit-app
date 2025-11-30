import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export type ApiOk<T extends object = {}> = { ok: true } & T;
export type ApiErr = { ok: false; error: string };

export function jsonOk<T extends object = {}>(body?: T, init?: number) {
  return NextResponse.json(
    { ok: true, ...(body ?? ({} as any)) } satisfies ApiOk<T>,
    { status: init ?? 200 }
  );
}

export function jsonErr(error: string, status: number) {
  return NextResponse.json({ ok: false, error } satisfies ApiErr, {
    status,
  });
}

export async function requireAuthProfile(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr) {
    return { error: jsonErr('Authentication error', 401) };
  }
  if (!user) {
    return { error: jsonErr('Unauthorized', 401) };
  }

  // プロファイルを強制（profiles テーブル名はプロジェクトの実名に合わせてください）
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (pErr) {
    return { error: jsonErr('Failed to load profile', 500) };
  }
  if (!profile) {
    return { error: jsonErr('Profile not found', 403) };
  }

  return { supabase, user, profile };
}

