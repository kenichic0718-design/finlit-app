// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'

// 共通の JSON ヘルパー
function json(body: any, init?: number) {
  return NextResponse.json(body, { status: init ?? 200 })
}

/**
 * GET /api/categories?kind=expense|income
 * - 現在ログイン中ユーザーのカテゴリ一覧を返す
 */
export async function GET(req: NextRequest) {
  const supabase = getServerSupabase()
  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr || !auth?.user) {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }

  const { searchParams } = new URL(req.url)
  const kind = searchParams.get('kind') as 'expense' | 'income' | null

  let query = supabase
    .from('categories')
    .select('id, name, kind, position, is_active')
    .eq('profile_id', auth.user.id)

  if (kind) {
    query = query.eq('kind', kind)
  }

  const { data, error } = await query
    .order('position', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    return json({ ok: false, error: 'select_failed', detail: error.message }, 500)
  }

  return json({ ok: true, items: data ?? [] })
}

/**
 * POST /api/categories
 * body: { kind: 'expense'|'income', name: string }
 */
export async function POST(req: NextRequest) {
  const supabase = getServerSupabase()
  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr || !auth?.user) {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }

  const body = (await req.json().catch(() => ({}))) as {
    kind?: 'expense' | 'income'
    name?: string
  }

  const kind = body.kind
  const name = (body.name ?? '').trim()

  if (!kind || !name) {
    return json(
      { ok: false, error: 'bad_request', detail: 'kind and name are required' },
      400,
    )
  }

  // そのユーザー + kind で最大 position を取得し、+10 した値を採用
  const { data: maxRows, error: maxErr } = await supabase
    .from('categories')
    .select('position')
    .eq('profile_id', auth.user.id)
    .eq('kind', kind)
    .order('position', { ascending: false })
    .limit(1)

  if (maxErr) {
    return json({ ok: false, error: 'select_failed', detail: maxErr.message }, 500)
  }

  const nextPos = ((maxRows?.[0]?.position as number | null) ?? 0) + 10

  const { data, error } = await supabase
    .from('categories')
    .insert({
      profile_id: auth.user.id,
      kind,
      name,
      is_active: true,
      position: nextPos,
    })
    .select('id, name, kind, position, is_active')
    .single()

  if (error) {
    return json({ ok: false, error: 'insert_failed', detail: error.message }, 500)
  }

  return json({ ok: true, item: data })
}

type MoveOp = 'top' | 'up' | 'down' | 'bottom'

/**
 * PATCH /api/categories
 * body: { id: string, op: 'top' | 'up' | 'down' | 'bottom' }
 * - 同じ kind 内で position を詰め直して並び替え
 */
export async function PATCH(req: NextRequest) {
  const supabase = getServerSupabase()
  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr || !auth?.user) {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }

  const body = (await req.json().catch(() => ({}))) as {
    id?: string
    op?: MoveOp
  }

  const id = body.id ?? ''
  const op = body.op

  if (!id || !op) {
    return json(
      { ok: false, error: 'bad_request', detail: 'id and op are required' },
      400,
    )
  }

  // まず全カテゴリを取得
  const { data: rows, error } = await supabase
    .from('categories')
    .select('id, kind, position')
    .eq('profile_id', auth.user.id)
    .order('position', { ascending: true })

  if (error) {
    return json({ ok: false, error: 'select_failed', detail: error.message }, 500)
  }

  const list = rows ?? []
  const current = list.find((c) => c.id === id)
  if (!current) {
    return json({ ok: false, error: 'not_found' }, 404)
  }

  // 同じ kind の中だけで並び替え
  const sameKind = list.filter((c) => c.kind === current.kind)
  const srcIndex = sameKind.findIndex((c) => c.id === id)
  if (srcIndex === -1) {
    return json({ ok: false, error: 'not_found' }, 404)
  }

  let dstIndex = srcIndex
  if (op === 'top') dstIndex = 0
  if (op === 'bottom') dstIndex = sameKind.length - 1
  if (op === 'up') dstIndex = Math.max(0, srcIndex - 1)
  if (op === 'down') dstIndex = Math.min(sameKind.length - 1, srcIndex + 1)

  // 位置が変わらないならそのまま成功扱い
  if (dstIndex === srcIndex) {
    return json({ ok: true })
  }

  // 並び替え後の position を 10 刻みで再採番
  const reordered = [...sameKind]
  const [moved] = reordered.splice(srcIndex, 1)
  reordered.splice(dstIndex, 0, moved)

  const updates = reordered.map((c, idx) => ({
    id: c.id,
    position: (idx + 1) * 10,
  }))

  // トランザクションがないので 1件ずつ UPDATE
  for (const u of updates) {
    const { error: updErr } = await supabase
      .from('categories')
      .update({ position: u.position })
      .eq('id', u.id)
      .eq('profile_id', auth.user.id)

    if (updErr) {
      return json(
        { ok: false, error: 'update_failed', detail: updErr.message },
        500,
      )
    }
  }

  return json({ ok: true })
}

/**
 * DELETE /api/categories?id=...
 */
export async function DELETE(req: NextRequest) {
  const supabase = getServerSupabase()
  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr || !auth?.user) {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return json(
      { ok: false, error: 'bad_request', detail: 'id is required' },
      400,
    )
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('profile_id', auth.user.id)

  if (error) {
    return json({ ok: false, error: 'delete_failed', detail: error.message }, 400)
  }

  return json({ ok: true })
}

