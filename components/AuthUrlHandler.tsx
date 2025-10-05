// components/AuthUrlHandler.tsx
"use client";
import { useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function AuthUrlHandler() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const code = sp.get("code");
    if (!code) return;

    // 既に /auth/callback ならサーバー側に任せる
    if (pathname.startsWith("/auth/callback")) return;

    (async () => {
      const supabase = getSupabaseClient();
      try {
        // クライアント側でセッションを確立（保険）
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // 失敗したらサーバールートに回す
          router.replace(`/auth/callback?code=${encodeURIComponent(code)}&redirect_to=/settings`);
        } else {
          router.replace("/settings");
        }
      } catch {
        router.replace(`/auth/callback?code=${encodeURIComponent(code)}&redirect_to=/settings`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp, pathname]);

  return null;
}

