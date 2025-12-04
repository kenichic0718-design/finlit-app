// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * Magic Link クリック後に来るコールバックページ
 *
 * - URL（クエリ or ハッシュ）に含まれるトークンを Supabase に渡して
 *   セッションを保存してもらう（= Cookie にも反映される）
 * - 成功したら next パラメータ or "/" にリダイレクト
 * - 失敗したら /login に戻す
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next") ?? "/";
    const supabase = supabaseBrowser();

    (async () => {
      try {
        // 型定義上は getSessionFromUrl が見えないので any キャストで呼ぶ
        const { data, error } = await (supabase.auth as any).getSessionFromUrl({
          storeSession: true,
        });

        if (error) {
          console.error("[auth/callback] getSessionFromUrl error:", error);
          router.replace("/login?error=callback_failed");
          return;
        }

        if (!data?.session) {
          console.error("[auth/callback] no session returned");
          router.replace("/login?error=missing_session");
          return;
        }

        // セッション保存に成功したので、元のページ or ダッシュボードへ
        router.replace(next);
      } catch (e) {
        console.error("[auth/callback] unexpected error:", e);
        router.replace("/login?error=callback_failed");
      }
    })();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p>ログイン処理中です。少々お待ちください…</p>
    </main>
  );
}

