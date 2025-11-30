"use client";

import { useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * アプリ起動時に一度だけセッションを触って、
 * Supabase の Cookie / セッション状態を安定させるフック
 */
export function useBoot() {
  useEffect(() => {
    const sb = createClientComponentClient();

    // 起動時にセッションを触って Cookie を最新化
    sb.auth.getSession().catch(() => {
      // ウォーミングアップ用途なのでエラーは握りつぶす
    });
  }, []);
}
