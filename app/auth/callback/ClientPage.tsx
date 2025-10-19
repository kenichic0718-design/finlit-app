// app/auth/callback/ClientPage.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

function pickRedirect(search: URLSearchParams) {
  const r = search.get('redirect_to') || '/';
  try {
    const u = new URL(r, 'https://dummy.local'); // 相対のみ許可
    return u.pathname + u.search + u.hash;
  } catch {
    return '/';
  }
}

export default function ClientPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [msg, setMsg] = useState('Completing sign-in...');

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const redirectTo = pickRedirect(search);

      try {
        // URLに ?code= / #access_token= があれば交換
        const { data, error } = await supabase.auth.exchangeCodeForSession();
        if (!error && data?.session) {
          router.replace(redirectTo);
          return;
        }
        if (error) setMsg(error.message);
      } catch (e: any) {
        setMsg(e?.message || 'Failed to finalize sign-in');
      }

      // 既存セッションがあれば遷移
      const { data: s } = await supabase.auth.getSession();
      if (s?.session) {
        router.replace(redirectTo);
        return;
      }

      // どちらも無ければ明示
      setMsg('No auth code/token found in URL hash/query.');
    })();
  }, [router, search]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Auth Callback</h1>
      <p>{msg}</p>
    </main>
  );
}

