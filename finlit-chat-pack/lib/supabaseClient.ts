// lib/supabaseClient.ts
'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/app/_supabase/client';

/** 互換API：旧名の getSupabaseClient を新実装に委譲 */
export function getSupabaseClient(): SupabaseClient {
  return getSupabaseBrowser();
}

/** 互換API：旧来の `supabase` 直接参照があっても1個体だけ返す */
let _singleton: SupabaseClient | null = null;
export const supabase: SupabaseClient = (() => {
  if (_singleton) return _singleton;
  _singleton = getSupabaseBrowser();
  return _singleton;
})();
