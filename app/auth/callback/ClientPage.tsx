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
      detectSessionInUrl: false, // 自前で code を処理する
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
      const code = params.get('code');
      const token_hash = params.get('token_hash');
      const type = params.get('type'); // magiclink / recovery など
      const redirectTo = params.get('redirect_to') || '/settings';

      setDebug({
        href: window.location.href,
        hasCode: !!code,
        hasTokenHash: !!token_hash,
        type,
        redirectTo,
      });

      try {
        // 1) code がある：セッション交換
        if (code) {
          setMsg('Exchanging auth code…');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setMsg('Signed in. Redirecting…');
          router.replace(redirectTo);
          return;
        }

        // 2) token_hash + type（recovery など）で verify
        if (token_hash && type) {
          setMsg('Verifying token…');
          const { error } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash,
          });
          if (error) throw error;
          setMsg('Token verified. Redirecting…');
          router.replace(redirectTo);
          return;
        }

        // 3) どちらも無い：そのまま画面に残してデバッグ表示
        setMsg('No auth code/token in URL. Open the magic link from your email on this device.');
      } catch (e: any) {
        console.error('[/auth/callback] error:', e);
        setMsg(`Sign-in failed: ${e?.message || String(e)}`);
        // 失敗時は 1.2 秒待ってログインへ
        setTimeout(() => router.replace('/login'), 1200);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Auth Callback</h1>
      <p style={{ marginTop: 8 }}>{msg}</p>

      {/* デバッグ情報（必要に応じて消してOK） */}
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

