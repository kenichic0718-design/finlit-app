// app/api/categories/[id]/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { requireAuthProfile } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json<T>(body: T, status = 200) {
  return NextResponse.json(body as any, { status });
}

type Ctx = { params: { id: string } };

/**
 * PATCH /api/categories/:id
 * body: { name?: string }
 * ※ 所有権（profile_id）が自分のものだけ更新可能
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const id = params?.id;
  if (!id) return json({ ok: false, error: 'Missing id' }, 400);

  const auth = await requireAuthProfile();
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const patch: Record<string, any> = {};
  if (typeof body?.name === 'string') {
    const name = body.name.trim();
    if (!name) return json({ ok: false, error: 'name must not be empty' }, 400);
    patch.name = name;
  }

  if (Object.keys(patch).length === 0) {
    return json({ ok: false, error: 'Nothing to update' }, 400);
  }

  const { supabase, profileId } = auth;

  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('id', id)
    .eq('profile_id', profileId)
    .select()
    .maybeSingle();

  if (error) return json({ ok: false, error: error.message }, 500);
  if (!data) return json({ ok: false, error: 'Not found or not owned' }, 404);

  return json({ ok: true, item: data });
}

/**
 * DELETE /api/categories/:id
 * ※ 所有権（profile_id）が自分のものだけ削除可能
 */
export async function DELETE(_req: Request, { params }: Ctx) {
  const id = params?.id;
  if (!id) return json({ ok: false, error: 'Missing id' }, 400);

  const auth = await requireAuthProfile();
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const { supabase, profileId } = auth;

  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('profile_id', profileId)
    .select()
    .maybeSingle();

  if (error) return json({ ok: false, error: error.message }, 500);
  if (!data) return json({ ok: false, error: 'Not found or not owned' }, 404);

  return json({ ok: true, item: data });
}

