// app/auth/callback/ClientPage.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // 自前で URL を処理する
    },
  }
);

export default function ClientPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [msg, setMsg] = useState('Processing sign-in…');
  const [debug, setDebug] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      const redirectTo = params.get('redirect_to') || '/settings';
      const code = params.get('code');
      const token_hash = params.get('token_hash');
      const type = params.get('type');

      // location.hash をパース（implicit/hash フロー用）
      const hash = window.location.hash || '';
      const hp = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
      const access_token = hp.get('access_token');
      const refresh_token = hp.get('refresh_token');

      setDebug({
        href: window.location.href,
        hasCode: !!code,
        hasTokenHash: !!token_hash,
        hashHasAccess: !!access_token,
        hashHasRefresh: !!refresh_token,
        type,
        redirectTo,
      });

      try {
        // 1) 認可コードフロー
        if (code) {
          setMsg('Exchanging auth code…');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          // URL の code を消す
          window.history.replaceState(null, '', window.location.pathname);
          setMsg('Signed in. Redirecting…');
          router.replace(redirectTo);
          return;
        }

        // 2) implicit/hash フロー
        if (access_token && refresh_token) {
          setMsg('Restoring session from hash…');
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;

          // # を消す（F5で再実行されないように）
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          setMsg('Signed in. Redirecting…');
          router.replace(redirectTo);
          return;
        }

        // 3) verifyOtp（recovery など）
        if (token_hash && type) {
          setMsg('Verifying token…');
          const { error } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash,
          });
          if (error) throw error;

          window.history.replaceState(null, '', window.location.pathname);
          setMsg('Token verified. Redirecting…');
          router.replace(redirectTo);
          return;
        }

        // 4) 何もない
        setMsg('No auth code/token in URL. Open the magic link from your email on this device.');
      } catch (e: any) {
        console.error('[/auth/callback] error:', e);
        setMsg(`Sign-in failed: ${e?.message || String(e)}`);
        setTimeout(() => router.replace('/login'), 1500);
      }
    })();
  }, [params, router]);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Auth Callback</h1>
      <p style={{ marginTop: 8 }}>{msg}</p>
      <pre
        style={{
          marginTop: 16,
          padding: 12,
          background: '#f5f5f5',
          borderRadius: 8,
          overflowX: 'auto',
          fontSize: 12,
        }}
      >
        {JSON.stringify(debug, null, 2)}
      </pre>
    </main>
  );
}

