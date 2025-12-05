// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * Supabase のメールリンクから戻ってきたときのコールバックページ
 *
 * - URL フラグメントの access_token / refresh_token などを
 *   supabase-js が自動検出してセッション保存（detectSessionInUrl: true）
 * - セッション取得に成功したら next（なければ /dashboard）へリダイレクト
 * - 失敗したら /login?error=callback_failed へ戻す
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next") ?? "/dashboard";
    const supabase = supabaseBrowser();

    const run = async () => {
      // detectSessionInUrl により、初回呼び出し時に URL からセッションを復元してくれる
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        // ここで失敗した場合は、トークンが無効 or 期限切れなど
        router.replace(
          `/login?error=callback_failed&next=${encodeURIComponent(next)}`
        );
        return;
      }

      // セッションが取れたので、next へ遷移
      router.replace(next);
    };

    run();
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-400">ログイン処理中です…</p>
    </main>
  );
}

