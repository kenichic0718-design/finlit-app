// hooks/useBoot.ts
"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * アプリ起動時に Supabase のセッション検出を走らせるだけのフック
 *
 * - createClientComponentClient を使うのをやめて supabaseBrowser() に統一
 * - これで "Multiple GoTrueClient instances detected" 警告も抑制
 */
export function useBoot() {
  useEffect(() => {
    const supabase = supabaseBrowser();

    // ここで一度セッションを読んでおくことで、
    // detectSessionInUrl が発火して Cookie とメモリ状態が同期される
    supabase.auth.getSession().catch((error) => {
      console.error("[useBoot] getSession error", error);
    });
  }, []);
}

