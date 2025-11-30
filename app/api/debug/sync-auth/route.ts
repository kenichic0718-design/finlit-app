import { NextRequest } from 'next/server';
import { createSupabaseRouteClient } from '@/app/_utils/supabaseRoute';

export async function GET(req: NextRequest) {
  const { supabase, json } = createSupabaseRouteClient(req);
  const { data: sess, error: e1 } = await supabase.auth.getSession();
  if (e1) return json({ ok: false, step: 'getSession', error: e1.message }, 401);

  const { data: u, error: e2 } = await supabase.auth.getUser();
  if (e2 || !u?.user) return json({ ok: false, step: 'getUser', error: e2?.message || 'no_user' }, 401);

  return json({ ok: true, hasSession: !!sess?.session, user: u.user });
}

