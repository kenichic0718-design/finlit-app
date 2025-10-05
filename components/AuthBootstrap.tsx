// components/AuthBootstrap.tsx
'use client';

import { useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

/**
 * 匿名/既存セッションを1回だけウォームアップするための軽量ブートストラップ。
 * ここでは createClientComponentClient() を使わず、単一の getSupabaseBrowser() に統一。
 */
export default function AuthBootstrap() {
  useEffect(() => {
    const supabase = getSupabaseBrowser();

    // 既存セッションのウォームアップ（副作用なし）
    let isMounted = true;
    supabase.auth.getSession().finally(() => {
      if (!isMounted) return;
      // 何もしない：目的は GoTrue の初期化のみ
    });

    // 状態変化を購読（必要なら）
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // ここも何もしない。必要なら toasts などを入れる
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
