// app/auth/callback/ClientPage.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

/** URL の #hash を { key: value } にパース */
function parseHashParams(hash: string): Record<string, string> {
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  const sp = new URLSearchParams(h);
  const obj: Record<string, string> = {};
  sp.forEach((v, k) => (obj[k] = v));
  return obj;
}

export default function ClientPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const redirectTo = useMemo(() => sp.get('redirect_to') || '/settings', [sp]);

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowser();

      // 1) ハッシュ（email magic link など）
      const hashParams = parseHashParams(window.location.hash || '');
      const access_token = hashParams['access_token'];
      const refresh_token = hashParams['refresh_token'];

      try {
        if (access_token && refresh_token) {
          // Magic Link（hash）→ セッション確立
          await supabase.auth.setSession({ access_token, refresh_token });

          // ハッシュが残ると今後のルーティングで邪魔なので消してリダイレクト
          const clean = new URL(window.location.href);
          clean.hash = '';
          window.history.replaceState(null, '', clean.toString());
          router.replace(redirectTo);
          router.refresh();
          return;
        }

        // 2) クエリ code（PKCE / OAuth）
        const code = sp.get('code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          router.replace(redirectTo);
          router.refresh();
          return;
        }

        // 3) 何もない → 案内
        setError('No auth code/token found in URL hash/query.');
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? 'Failed to complete sign-in.');
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Auth Callback</h1>
        <p style={{ marginTop: 8, color: 'crimson' }}>{error}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Auth Callback</h1>
      <p style={{ marginTop: 8 }}>Completing sign-in…</p>
    </main>
  );
}

