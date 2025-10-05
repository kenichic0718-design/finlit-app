// app/api/logs/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { LOGS_TABLE, LogsColumns } from '@/types/logs';

const ALLOW_KEYS = new Set(LogsColumns.map(c => c.name));

/** ざっくり型/値の整形（information_schemaの dataType ベース） */
function coerceValue(name: string, raw: any) {
  const meta = LogsColumns.find(c => c.name === name);
  if (!meta) return raw;
  const t = meta.dataType.toLowerCase();

  if (raw === null || raw === undefined) return null;

  // boolean
  if (t.includes('boolean')) {
    if (typeof raw === 'boolean') return raw;
    if (raw === 'true' || raw === '1') return true;
    if (raw === 'false' || raw === '0') return false;
    return Boolean(raw);
  }

  // number
  if (t.includes('int') || t.includes('numeric') || t.includes('decimal') ||
      t.includes('real') || t.includes('double')) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  // date/time/timestamp → ISO文字列として扱う
  if (t.includes('timestamp') || t.includes('time') || t === 'date') {
    // 文字列で来る想定。無効なら null
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : new Date(d.toISOString()).toISOString();
  }

  // json
  if (t.includes('json')) {
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(String(raw)); } catch { return null; }
  }

  // text/uuid 等 → 文字列
  return String(raw);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServer();

  // 認証ユーザー（任意: 未ログインでも許可したいなら外してOK）
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null }}));

  const body = await req.json().catch(() => ({} as Record<string, any>));
  const payload: Record<string, any> = {};

  // 許可されたキーのみ通す（将来カラムが増えても安全）
  for (const [k, v] of Object.entries(body)) {
    if (ALLOW_KEYS.has(k)) {
      payload[k] = coerceValue(k, v);
    }
  }

  // user_id カラムが存在するならサーバー側で確実に設定
  if (user && ALLOW_KEYS.has('user_id')) {
    payload['user_id'] = user.id;
  }

  // 空ペイロードを防ぐ
  if (Object.keys(payload).length === 0) {
    return NextResponse.json(
      { ok: false, error: 'no valid fields' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from(LOGS_TABLE)
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, item: data ?? null });
}

