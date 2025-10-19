// app/auth/callback/ClientPage.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

/**
 * ハッシュ(#access_token=...) と code(PKCE) の両対応
 * - code があれば exchangeCodeForSession()
 * - なければ location.hash から access_token/refresh_token を拾って setSession()
 */
export default function ClientPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState<string>('Completing sign-in...');

  // ここで直接クライアントを作る（getSupabaseBrowser 等の命名ゆれ対策）
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const redirect = sp.get('redirect_to') || '/';

        // 1) code（PKCE）フロー
        const code = sp.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
          router.replace(redirect);
          return;
        }

        // 2) ハッシュ（access_token / refresh_token）フロー
        const hash = window.location.hash?.replace(/^#/, '');
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
          if (!data.session) throw new Error('No session returned');
          router.replace(redirect);
          return;
        }

        // 3) どちらもない
        setMsg('No auth code/token found in URL hash/query.');
      } catch (e: any) {
        console.error(e);
        setMsg(`Auth error: ${e?.message || 'Unknown error'}`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Auth Callback</h1>
      <p>{msg}</p>
    </main>
  );
}

