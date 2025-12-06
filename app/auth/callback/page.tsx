// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const supabase = supabaseBrowser();

      try {
        // 現在の URL（token_hash / type など）を Supabase に解釈させてセッション確立
        // getSessionFromUrl は内部で /auth/v1/verify を叩きます
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.auth as any).getSessionFromUrl({
          storeSession: true,
        });

        if (error || !data?.session) {
          console.error("[auth/callback] getSessionFromUrl error:", error);
          router.replace("/login?error=callback_failed");
          return;
        }

        // セッションが張れたのでトップへ
        router.replace("/");
      } catch (e) {
        console.error("[auth/callback] unexpected error:", e);
        router.replace("/login?error=callback_failed");
      }
    };

    void run();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <p className="text-sm text-gray-400">
        ログイン処理をしています。しばらくお待ちください…
      </p>
    </main>
  );
}

