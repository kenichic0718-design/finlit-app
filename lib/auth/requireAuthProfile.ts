import 'server-only';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function requireAuthProfile() {
  const supabase = createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { ok: false as const, status: 401, error: 'Unauthorized', user: null, profile_id: null };
  }
  return { ok: true as const, status: 200, error: null, user, profile_id: user.id, supabase };
}

