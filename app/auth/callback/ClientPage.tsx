'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function ClientPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState('Processing sign-in…');

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  useEffect(() => {
    const run = async () => {
      try {
        const redirectTo = params.get('redirect_to') || '/settings';
        const code = params.get('code');
        const token_hash = params.get('token_hash');
        const type = params.get('type'); // e.g. 'magiclink', 'recovery', ...

        // 1) code 方式（OAuth / Magic Link）
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setMsg('Signed in. Redirecting…');
          router.replace(redirectTo);
          return;
        }

        // 2) token_hash 方式（recovery 等）
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          if (error) throw error;
          setMsg('Verified. Redirecting…');
          router.replace(redirectTo);
          return;
        }

        // 3) 何も無ければログインへ
        setMsg('No auth params. Redirecting…');
        router.replace('/login');
      } catch (e: any) {
        console.error('[auth/callback] error', e?.message ?? e);
        setMsg('Sign-in failed. Please try again from the login page.');
        setTimeout(() => router.replace('/login'), 1200);
      }
    };

    run();
  }, [params, router, supabase]);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Auth Callback</h1>
      <p style={{ marginTop: 8 }}>{msg}</p>
    </main>
  );
}

