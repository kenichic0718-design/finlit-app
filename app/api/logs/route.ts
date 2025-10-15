// app/api/logs/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

// -----------------------------
// GET: ログ一覧（既存の挙動を踏襲）
//   ?limit=20&offset=0
//   ※ 認証なしでも一覧取得できる現在の仕様に合わせています
// -----------------------------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');

    const limit = Number.isFinite(Number(limitParam)) ? Math.min(parseInt(limitParam as string, 10), 100) : 20;
    const offset = Number.isFinite(Number(offsetParam)) ? Math.max(parseInt(offsetParam as string, 10), 0) : 0;

    const supabase = getSupabaseServer();

    // 並びは新しい順。offset/limit を適用
    const from = offset;
    const to = offset + limit - 1;

    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('id', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}

// -----------------------------
// POST: 互換エンドポイント（/api/logs にも POST を許可）
//   body: { amount: number|string, memo?: string|null, category_id?: string|null, is_income?: boolean, date?: 'YYYY-MM-DD' }
//   認証必須（ユーザーのセッション Cookie を利用）
// -----------------------------
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServer();

    // サインイン済みユーザー確認
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      return NextResponse.json({ ok: false, error: userErr.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // JSON 受け取り
    const body = (await req.json().catch(() => null)) as
      | {
          amount?: number | string;
          memo?: string | null;
          category_id?: string | null;
          is_income?: boolean;
          date?: string; // 省略時は今日
        }
      | null;

    if (!body) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }

    // amount バリデーション
    const amountNum = Number(body.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid amount' }, { status: 400 });
    }

    // 日付（YYYY-MM-DD）
    const isoDate = body.date ?? new Date().toISOString().slice(0, 10);

    // 登録
    const { error } = await supabase.from('logs').insert({
      profile_id: user.id,
      date: isoDate,
      amount: amountNum,
      memo: body.memo ?? null,
      is_income: !!body.is_income, // 未指定なら false(支出)
      category_id: body.category_id ?? null,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}

