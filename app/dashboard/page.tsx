// app/dashboard/page.tsx
import 'server-only';
import { getSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ClientBoundary from './ClientBoundary';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent('/dashboard')}`);
  return <ClientBoundary />;
}

