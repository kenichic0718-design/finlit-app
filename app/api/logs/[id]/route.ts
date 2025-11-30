// app/api/logs/[id]/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 自分の行だけ削除
  const { error } = await supabase
    .from('logs')
    .delete()
    .eq('id', id)
    .eq('profile_id', user.id)

  if (error) return NextResponse.json({ error: 'logs delete failed', detail: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

