export const runtime = 'nodejs';
function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}
export const SUPABASE_URL = reqEnv('NEXT_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = reqEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
