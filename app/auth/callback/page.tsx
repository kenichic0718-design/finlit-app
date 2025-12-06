// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * メールリンク / OAuth などから戻ってきたときのコールバックページ
 *
 * - Magic Link 等: token_hash + type を verifyOtp に渡してセッションを張る
 * - OAuth 等: code を exchangeCodeForSession でセッションに交換する
 * - 成功したら next（または / ）へリダイレクト
 * - 失敗したら /login?error=callback_failed へリダイレクト
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const supabase = supabaseBrowser();

      // 例:
      //   /auth/callback?token_hash=xxx&type=magiclink&next=/dashboard
      //   /auth/callback?code=xxxxx&next=/dashboard
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const typeParam = searchParams.get("type");
      const nextParam = searchParams.get("next") ?? "/";

      // next は絶対パスだけ許可（外部サイトへの飛び出し防止）
      const nextPath = nextParam.startsWith("/") ? nextParam : "/";

      try {
        if (tokenHash && typeParam) {
          // 🔹 Magic Link / Email OTP 用の正規ルート
          const { error } = await (supabase.auth as any).verifyOtp({
            type: typeParam as any, // "magiclink" | "signup" | "recovery" など
            token_hash: tokenHash,
          });

          if (error) {
            console.error("[auth/callback] verifyOtp error:", error);
            router.replace("/login?error=callback_failed");
            return;
          }
        } else if (code) {
          // 🔹 OAuth など code ベースのフロー用（今後の拡張に備えて残す）
          const { error } = await (supabase.auth as any).exchangeCodeForSession(
            code
          );

          if (error) {
            console.error(
              "[auth/callback] exchangeCodeForSession error:",
              error
            );
            router.replace("/login?error=callback_failed");
            return;
          }
        } else {
          // code も token_hash も無いパターン
          console.error("[auth/callback] no code or token_hash in URL", {
            search: typeof window !== "undefined" ? window.location.search : "",
          });
          router.replace("/login?error=missing_code");
          return;
        }

        // ここまで来たらセッション張れている想定なので next へ
        router.replace(nextPath);
      } catch (e) {
        console.error("[auth/callback] unexpected error:", e);
        router.replace("/login?error=callback_failed");
      }
    };

    run();
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-400">ログイン処理中です...</p>
    </main>
  );
}

