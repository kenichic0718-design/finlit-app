// app/_supabase/route.ts
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Route Handler / Server Action 用。
 * ここでは cookie の set/remove が許可されています。
 */
export function getSupabaseRoute(): SupabaseClient {
  // auth-helpers が内部で GoTrue を1つだけ扱う
  return createRouteHandlerClient({ cookies });
}
