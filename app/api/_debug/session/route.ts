import { NextRequest } from 'next/server';
import { createSupabaseRouteClient } from '@/app/_utils/supabaseRoute';

export async function GET(req: NextRequest) {
  const { supabase, json } = createSupabaseRouteClient(req);
  const { data, error } = await supabase.auth.getSession();
  return json({
    ok: !error,
    hasSession: !!data?.session,
    userId: data?.session?.user?.id || null,
    error: error?.message || null,
  });
}

