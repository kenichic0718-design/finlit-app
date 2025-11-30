'use client';

import { useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function AuthUrlHandler() {
  useEffect(() => {
    const supabase = getSupabaseBrowser();

    // 初回に現在の状態を拾っておく（ハッシュに access_token があれば SDK が処理）
    supabase.auth.getSession().catch(() => {});

    // 状態の変化を拾っておく（必要ならリロードや遷移に使う）
    const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
      // ここで必要なら Router でリダイレクトする
      // 例: if (session) router.replace('/settings')
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}

