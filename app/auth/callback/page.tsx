// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function CallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // 1) #hash からトークンを拾ってクライアント側に setSession（従来通り）
      const hash = window.location.hash; // #access_token=...&refresh_token=...
      const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          console.error("setSession error", error);
          return;
        }
      }

      // 2) サーバー側に Cookie を同期（ここが今回の肝）
      const { data } = await supabase.auth.getSession();
      await fetch("/api/auth/callback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: data.session }),
      });

      // 3) 元の画面へ
      router.replace(sp.get("next") || "/");
    })();
  }, [router, sp]);

  return <p style={{ padding: 24 }}>サインイン処理中…</p>;
}

