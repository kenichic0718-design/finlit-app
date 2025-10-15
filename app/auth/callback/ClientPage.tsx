// app/auth/callback/ClientPage.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function ClientPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    async function run() {
      const supabase = getSupabaseBrowser();

      // 1) code フロー（query に code がある）
      const code = params.get('code');
      const redirectTo = params.get('redirect_to') || '/settings';

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('exchangeCodeForSession error', error);
        }
        router.replace(redirectTo);
        return;
      }

      // 2) ハッシュフロー（/#access_token=... のケース）
      const hash = window.location.hash; // 例: #access_token=...&refresh_token=...
      if (hash?.includes('access_token')) {
        const qs = new URLSearchParams(hash.slice(1));
        const access_token = qs.get('access_token')!;
        const refresh_token = qs.get('refresh_token');

        // アクセストークンだけでも setSession できます
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || undefined,
        });
        if (error) {
          console.error('setSession error', error);
        }
        router.replace(redirectTo);
        return;
      }

      // 何も無ければログインへ
      router.replace('/login');
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Auth Callback</h1>
      <p style={{ marginTop: 8 }}>Processing sign-in…</p>
    </main>
  );
}

