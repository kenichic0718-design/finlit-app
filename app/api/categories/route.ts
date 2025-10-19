// app/api/categories/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { requireAuthProfile } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Kind = 'expense' | 'income';

function json<T>(body: T, status = 200) {
  return NextResponse.json(body as any, { status });
}

function isKind(v: unknown): v is Kind {
  return v === 'expense' || v === 'income';
}

/**
 * GET /api/categories?kind=expense|income
 * 認証ユーザーのカテゴリ一覧を取得
 */
export async function GET(req: Request) {
  const auth = await requireAuthProfile();
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get('kind') as Kind | null;

  const q = auth.supabase
    .from('categories')
    .select('*')
    .eq('profile_id', auth.profileId)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  const { data, error } = kind ? await q.eq('kind', kind) : await q;
  if (error) return json({ ok: false, error: error.message }, 500);

  return json({ ok: true, items: data ?? [] });
}

/**
 * POST /api/categories
 * body: { name: string, kind: 'expense'|'income' }
 * 追加（/add ラッパーからも呼ばれます）
 */
export async function POST(req: Request) {
  const auth = await requireAuthProfile();
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const rawName = typeof body?.name === 'string' ? body.name.trim() : '';
  const rawKind = body?.kind;

  if (!rawName) return json({ ok: false, error: 'name is required' }, 400);
  if (!isKind(rawKind)) return json({ ok: false, error: 'kind must be "expense" or "income"' }, 400);

  const { supabase, profileId } = auth;

  const { data, error } = await supabase
    .from('categories')
    .insert([{ name: rawName, kind: rawKind as Kind, profile_id: profileId }])
    .select()
    .maybeSingle();

  if (error) return json({ ok: false, error: error.message }, 500);

  return json({ ok: true, item: data }, 201);
}

