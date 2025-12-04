// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * Supabase のメールリンクから戻ってきたときのコールバックページ。
 *
 * ポイント：
 * - supabaseBrowser()（@supabase/ssr の createBrowserClient）を生成するだけで
 *   URL ハッシュに含まれている access_token / refresh_token を検出して
 *   自動的にセッションを保存してくれる（detectSessionInUrl）。
 * - その後、auth.getSession() でセッションが取れるか確認し、
 *   OK なら next へ、ダメなら /login に戻す。
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next") ?? "/";

    const run = async () => {
      try {
        // ここで Supabase Browser Client を生成 → detectSessionInUrl が走る
        const supabase = supabaseBrowser();

        // URL からのセッション検出が終わったあと、実際にセッションがあるか確認
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

        // セッション取得成功 → next へ
        router.replace(next);
      } catch (e) {
        console.error("[auth/callback] unexpected error:", e);
        router.replace(
          `/login?error=callback_failed&next=${encodeURIComponent(
            next
          )}`
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

