// app/api/categories/[id]/route.ts
import { NextResponse } from 'next/server';

// ✅ まずはエイリアス版（@）で試す
import { getRouteSupabase } from '@/app/_supabase/route';

// ⬇もしビルドで again 「…getRouteSupabase is not a function」が出たら、
// この1行を上の行の代わりに使ってください（相対パス直指定版）
// import { getRouteSupabase } from '../../_supabase/route';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sb = getRouteSupabase();
    const { error } = await sb.from('categories').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}

// 名称変更（フロントの「名称変更」ボタンに対応）
// body: { name: string }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });

    const sb = getRouteSupabase();
    const { error } = await sb.from('categories').update({ name }).eq('id', params.id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}

