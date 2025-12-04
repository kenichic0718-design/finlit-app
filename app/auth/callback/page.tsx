// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * Magic Link クリック後に来るコールバックページ
 *
 * - supabaseBrowser() を生成したタイミングで detectSessionInUrl が走り、
 *   URL ハッシュにあるトークンからセッションが保存される
 * - その後 auth.getSession() でセッションがあるか確認して next へ
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next") ?? "/";

    const run = async () => {
      try {
        const supabase = supabaseBrowser();

        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          console.error(
            "[auth/callback] session not found after redirect:",
            error
          );
          router.replace(
            `/login?error=callback_failed&next=${encodeURIComponent(next)}`
          );
          return;
        }

        router.replace(next);
      } catch (e) {
        console.error("[auth/callback] unexpected error:", e);
        router.replace(
          `/login?error=callback_failed&next=${encodeURIComponent(next)}`
        );
      }
    };

    run();
  }, [router, searchParams]);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">ログイン処理中です</h1>
      <p>しばらくお待ちください...</p>
    </main>
  );
}

