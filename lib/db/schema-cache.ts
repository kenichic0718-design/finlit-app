import 'server-only'
import { createClient } from '@supabase/supabase-js'
function getAdmin() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!  // Health が hasServiceKey:true なので存在
  return createClient(url, key, { auth: { persistSession: false } })
}
type ColumnsCache = Map<string /* public.logs など */, Set<string>>
const g = globalThis as unknown as { __colsCache?: ColumnsCache }
if (!g.__colsCache) g.__colsCache = new Map()
const cache = g.__colsCache!
export async function getTableColumns(schema: string, table: string): Promise<Set<string>> {
  const key = `${schema}.${table}`
  const hit = cache.get(key)
  if (hit) return hit

  const supa = getAdmin()
  // information_schema から列名を取る（並びは不要なので column_name のみ）
  const { data, error } = await supa
    .from('information_schema.columns' as any) // 型の都合で any
    .select('column_name')
    .eq('table_schema', schema)
    .eq('table_name', table)

  // 注意: Supabase REST では information_schema は expose されてないことがあります。
  // その場合は SQL RPC 経由に切替（下の fallback を使用）
  if (error || !data) {
    const { data: rows, error: err2 } = await supa.rpc('exec_sql', {
      // 安全な読み取りだけ
      q: `select column_name
          from information_schema.columns
          where table_schema = ${schema === 'public' ? '\'public\'' : `'${schema}'`}
            and table_name   = '${table}'`
    } as any)
    if (err2) throw err2
    const set = new Set<string>((rows ?? []).map((r: any) => r.column_name))
    cache.set(key, set)
    return set
  }

  const set = new Set<string>(data.map((r: any) => r.column_name))
  cache.set(key, set)
  return set
}
export function pickKnownColumns<T extends Record<string, any>>(cols: Set<string>, body: T) {
  const out: Record<string, any> = {}
  for (const k of Object.keys(body || {})) {
    if (cols.has(k)) out[k] = (body as any)[k]
  }
  return out
}
