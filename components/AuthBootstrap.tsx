"use client";

import { useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

/**
 * 初回アクセスでセッションが無ければ匿名サインイン。
 * 成功時、profiles に upsert しておく。
 * 画面には何も描画しません。
 */
export default function AuthBootstrap() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Anon sign-in failed:", error.message);
          return;
        }
        const uid = data.user?.id;
        if (!uid) return;

        // profiles を upsert（存在しなければ作る）
        const { error: upErr } = await supabase
          .from("profiles")
          .upsert({ id: uid }, { onConflict: "id" });

        if (upErr) console.error("Upsert profile failed:", upErr.message);
      }
    })();
  }, []);

  return null;
}

