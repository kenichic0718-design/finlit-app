// app/auth/callback/ClientPage.tsx
k'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

function pickRedirect(search: URLSearchParams) {
  const r = search.get('redirect_to') || '/';
  try {
    // open redirect 防止：相対パスのみ許可
    const u = new URL(r, 'https://dummy.local');
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

      // 1) まず URL からのコード／トークンを交換（OAuth / Magic link の両対応）
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession();
        if (error) {
          // URLにトークンが無い・期限切れ等
          setMsg(error.message);
        }
        if (data?.session) {
          router.replace(redirectTo);
          return;
        }
      } catch (e: any) {
        setMsg(e?.message || 'Failed to finalize sign-in');
      }

      // 2) それでもダメなら、既にセッションがあるか最終確認
      const { data: s } = await supabase.auth.getSession();
      if (s?.session) {
        router.replace(redirectTo);
        return;
      }

      // 3) ここまで来たら URL にコード/トークンが無い
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

