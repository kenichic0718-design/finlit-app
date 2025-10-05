import { cookies as nextCookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env';
export const runtime = 'nodejs';
function cookieAdapterForHeaders() {
  const cookieStore = nextCookies();
  return {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions) {
      cookieStore.set(name, value, options as any);
    },
    remove(name: string, options: CookieOptions) {
      cookieStore.set(name, '', { ...options, maxAge: 0 } as any);
    },
  };
}
export function cookieAdapterForMiddleware(req: NextRequest, res: NextResponse) {
return {
    get(name: string) {
      return req.cookies.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions) {
      res.cookies.set(name, value, options as any);
    },
    remove(name: string, options: CookieOptions) {
      res.cookies.set(name, '', { ...options, maxAge: 0 } as any);
    },
  };
}
export function createSupabaseServerClient() {
return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: cookieAdapterForHeaders(),
  });
}
export function createSupabaseMiddlewareClient(req: NextRequest, res: NextResponse) {
return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: cookieAdapterForMiddleware(req, res),
  });
}
export async function ensureProfile() {
const supabase = createSupabaseServerClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return null;
const { data: rows, error: selErr } = await supabase
.from('profiles')
.select('*')
.eq('id', user.id)
.limit(1);
if (selErr) return null;
if (rows?.[0]) return rows[0];
const { data: inserted, error: insErr } = await supabase
.from('profiles')
.insert({ id: user.id })
.select()
.limit(1);
if (insErr || !inserted?.[0]) return null;
return inserted[0];
}
