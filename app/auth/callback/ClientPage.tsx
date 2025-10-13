'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

// URL ハッシュを { key: value } にパース
function parseHash(hash: string): Record<string, string> {
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  return h.split('&').reduce<Record<string, string>>((acc, kv) => {
    const [k, v] = kv.split('=');
    if (k) acc[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
    return acc;
  }, {});
}

// redirect_to（/auth/callback?redirect_to=... または #redirect_to=... の両方に対応）
function getRedirectTo(url: URL, hashParams: Record<string, string>) {
  const q = url.searchParams.get('redirect_to');
  return q || hashParams['redirect_to'] || '/settings';
}

export default function ClientPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [message, setMessage] = useState('Processing sign-in…');

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);

        // 1) “?code=”（PKCE / OIDC code flow）
        const code = url.searchParams.get('code');

        // 2) “#access_token=&refresh_token= …”（メールのマジックリンク）
        const hashParams = parseHash(window.location.hash);
        const accessToken = hashParams['access_token'];
        const refreshToken = hashParams['refresh_token'];

        const redirectTo = getRedirectTo(url, hashParams);

        if (code) {
          // Supabase が URL から code を拾って Cookie を設定
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;

          // URL のコード/ハッシュを消してから遷移
          router.replace(redirectTo);
          return;
        }

        if (accessToken && refreshToken) {
          // ハッシュ方式（magic link）
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;

          router.replace(redirectTo);
          return;
        }

        // どちらも無い＝メールのリンクを「別デバイス」や「無効化されたタブ」で開いた等
        setMessage('No auth code/token in URL. Open the magic link from your email on this device.');
      } catch (e: any) {
        console.error(e);
        setMessage(`Auth error: ${e?.message || 'unknown error'}`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Auth Callback</h1>
      <p style={{ marginTop: 8 }}>{message}</p>
    </main>
  );
}

